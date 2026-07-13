import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { randomUUID } from "node:crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";

const createSchema = z.object({ templateSlug: z.string().min(1) });
export async function POST(request: NextRequest) {
  const session = await getTrainingServerSession(request); if (!session) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para entrenar." }, 401);
  const parsed = createSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError({ code: "INVALID_INPUT", message: "Revisa el entrenamiento solicitado." }, 400);
  const { data: template } = await session.client.from("training_templates").select("id").eq("slug", parsed.data.templateSlug).eq("is_active", true).maybeSingle();
  if (!template) return jsonError({ code: "NOT_FOUND", message: "No encontramos este entrenamiento." }, 404);
  const { data, error } = await session.client.rpc("create_training_session", { p_template_id: template.id });
  if (error || !data) return jsonError({ code: "CREATE_FAILED", message: "No pudimos preparar el entrenamiento." }, 500);
  void new TrainingAnalyticsService(createServiceSupabaseClient()).recordServerEvent(session.user.id, { clientEventId: randomUUID(), eventName: "training_session_created", occurredAt: new Date().toISOString(), sessionId: data, templateId: template.id }).catch(() => undefined);
  return jsonData({ sessionId: data });
}
