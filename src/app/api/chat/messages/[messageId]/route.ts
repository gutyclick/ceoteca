import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("feedback"),
    rating: z.enum(["helpful", "not_helpful"]),
    reason: z.enum(["not_answered", "too_generic", "incorrect", "hard_to_understand", "other"]).nullable().optional(),
  }),
  z.object({ action: z.literal("truncate") }),
]);

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const token = bearer(request);
  if (!token) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para modificar el mensaje." }, 401);
  const auth = createServerSupabaseClient(token);
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return jsonError({ code: "UNAUTHORIZED", message: "Tu sesión ya no es válida." }, 401);

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError({ code: "INVALID_INPUT", message: "Revisa la acción solicitada." }, 400);
  const { messageId } = await context.params;
  const client = createServiceSupabaseClient();
  const { data: message, error } = await client
    .from("chat_messages")
    .select("id,user_id,conversation_id,role,status,created_at")
    .eq("id", messageId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) return jsonError({ code: "CHAT_MESSAGE_ERROR", message: "No pudimos consultar el mensaje." }, 500);
  if (!message?.conversation_id) return jsonError({ code: "MESSAGE_NOT_FOUND", message: "No encontramos este mensaje." }, 404);

  if (parsed.data.action === "feedback") {
    if (message.role !== "assistant") return jsonError({ code: "INVALID_MESSAGE", message: "Solo puedes valorar respuestas de CEO." }, 400);
    const { data, error: feedbackError } = await client
      .from("chat_message_feedback")
      .upsert({
        user_id: authData.user.id,
        message_id: message.id,
        rating: parsed.data.rating,
        reason: parsed.data.rating === "not_helpful" ? parsed.data.reason ?? null : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,message_id" })
      .select("message_id,rating,reason")
      .single();
    if (feedbackError) return jsonError({ code: "FEEDBACK_ERROR", message: "No pudimos guardar tu valoración." }, 500);
    return jsonData({ feedback: data });
  }

  if (message.role !== "user") return jsonError({ code: "INVALID_MESSAGE", message: "Selecciona un mensaje tuyo para continuar desde ese punto." }, 400);
  const { error: deleteError } = await client
    .from("chat_messages")
    .delete()
    .eq("user_id", authData.user.id)
    .eq("conversation_id", message.conversation_id)
    .gte("created_at", message.created_at);
  if (deleteError) return jsonError({ code: "TRUNCATE_ERROR", message: "No pudimos reemplazar la continuación." }, 500);

  const { data: previous } = await client
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", authData.user.id)
    .eq("conversation_id", message.conversation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  await client.from("chat_conversations").update({ last_message_at: previous?.created_at ?? new Date().toISOString() }).eq("id", message.conversation_id).eq("user_id", authData.user.id);
  return jsonData({ truncatedFrom: message.id });
}
