import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonData, jsonError } from "@/lib/api/response";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";
import { getTrainingServerSession } from "@/lib/training/server-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await getTrainingServerSession(request);
  if (!auth) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para entrenar." }, 401);
  const { sessionId } = await params;
  const serviceDb = createServiceSupabaseClient() as unknown as SupabaseClient;
  const { data: linkedSession } = await serviceDb
    .from("training_sessions")
    .select("learning_path_id,learning_path_module_id,learning_path_item_id")
    .eq("id", sessionId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  const { data, error } = await auth.client.rpc("complete_training_session", { p_session_id: sessionId });
  if (error) return jsonError({ code: "COMPLETE_FAILED", message: "No pudimos completar la sesión." }, 500);
  const analytics = new TrainingAnalyticsService(createServiceSupabaseClient());
  void analytics.recordServerEvent(auth.user.id, { clientEventId: randomUUID(), eventName: "training_session_completed", occurredAt: new Date().toISOString(), sessionId }).catch(() => undefined);
  if (linkedSession?.learning_path_item_id) {
    void analytics.recordServerEvent(auth.user.id, { clientEventId: randomUUID(), eventName: "training_path_item_completed", occurredAt: new Date().toISOString(), sessionId, properties: { path: String(linkedSession.learning_path_id), module: String(linkedSession.learning_path_module_id), source: String(linkedSession.learning_path_item_id) } }).catch(() => undefined);
    const [{ data: moduleProgress }, { data: pathProgress }] = await Promise.all([
      serviceDb.from("user_training_path_module_progress").select("status").eq("user_id", auth.user.id).eq("module_id", linkedSession.learning_path_module_id).maybeSingle(),
      serviceDb.from("user_training_path_progress").select("status").eq("user_id", auth.user.id).eq("path_id", linkedSession.learning_path_id).maybeSingle(),
    ]);
    if (moduleProgress?.status === "completed") void analytics.recordServerEvent(auth.user.id, { clientEventId: randomUUID(), eventName: "training_module_completed", occurredAt: new Date().toISOString(), sessionId, properties: { module: String(linkedSession.learning_path_module_id) } }).catch(() => undefined);
    if (pathProgress?.status === "completed") void analytics.recordServerEvent(auth.user.id, { clientEventId: randomUUID(), eventName: "training_path_completed", occurredAt: new Date().toISOString(), sessionId, properties: { path: String(linkedSession.learning_path_id) } }).catch(() => undefined);
  }
  return jsonData(data);
}
