import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingServerSession } from "@/lib/training/server-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await getTrainingServerSession(request); if (!auth) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para entrenar." }, 401);
  const { sessionId } = await params;
  const { data: session } = await auth.client.from("training_sessions").select("id,title,status,current_exercise_index,total_exercises,estimated_minutes,started_at,completed_at,template_id").eq("id", sessionId).eq("user_id", auth.user.id).maybeSingle();
  if (!session) return jsonError({ code: "NOT_FOUND", message: "No encontramos esta sesión." }, 404);
  const { data: exercises, error } = await auth.client.from("training_session_exercises").select("id,position,exercise_snapshot").eq("session_id", sessionId).order("position");
  if (error) return jsonError({ code: "LOAD_FAILED", message: "No pudimos cargar los ejercicios." }, 500);
  return jsonData({ session, exercises });
}
