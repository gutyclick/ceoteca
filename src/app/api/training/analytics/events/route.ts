import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";
import { getTrainingServerSession } from "@/lib/training/server-auth";

export async function POST(request: NextRequest) {
  const auth = await getTrainingServerSession(request);
  if (!auth) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para registrar tu progreso." }, 401);
  try {
    const result = await new TrainingAnalyticsService(createServiceSupabaseClient()).recordClientEvent(auth.user.id, await request.json());
    return jsonData(result, 202);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_EVENT";
    return jsonError({ code, message: "No pudimos registrar este evento." }, code.includes("FORBIDDEN") ? 403 : 400);
  }
}
