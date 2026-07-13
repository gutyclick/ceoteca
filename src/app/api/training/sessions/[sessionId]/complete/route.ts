import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingServerSession } from "@/lib/training/server-auth";
export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) { const auth = await getTrainingServerSession(request); if (!auth) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para entrenar." }, 401); const { sessionId } = await params; const { data, error } = await auth.client.rpc("complete_training_session", { p_session_id: sessionId }); if (error) return jsonError({ code: "COMPLETE_FAILED", message: "No pudimos completar la sesión." }, 500); return jsonData(data); }
