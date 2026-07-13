import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData,jsonError } from "@/lib/api/response";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingRoleplayService } from "@/lib/training/roleplay";
import { getTrainingServerSession } from "@/lib/training/server-auth";
const schema=z.object({clientTurnId:z.string().uuid(),message:z.string().trim().min(2).max(2000)}).strict();
const statuses:Record<string,number>={MONTHLY_LIMIT_REACHED:429,DAILY_SAFETY_LIMIT:429,RATE_LIMITED:429,TURN_LIMIT:409,SESSION_EXPIRED:409,SESSION_NOT_ACTIVE:409,PROVIDER_UNAVAILABLE:503,PROVIDER_EMPTY_RESPONSE:502};
export async function POST(request:NextRequest,{params}:{params:Promise<{sessionId:string}>}){const auth=await getTrainingServerSession(request);if(!auth)return jsonError({code:"UNAUTHORIZED",message:"Inicia sesión para continuar."},401);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError({code:"INVALID_INPUT",message:"Escribe una respuesta válida."},400);try{const {sessionId}=await params;return jsonData(await new TrainingRoleplayService(createServiceSupabaseClient()).turn(auth.user.id,sessionId,parsed.data));}catch(error){const code=error instanceof Error?error.message:"TURN_FAILED";return jsonError({code,message:code==="MONTHLY_LIMIT_REACHED"?"Alcanzaste el límite mensual de simulaciones.":code==="RATE_LIMITED"?"Espera un momento antes de enviar otro mensaje.":code==="DAILY_SAFETY_LIMIT"?"Alcanzaste el límite de seguridad diario.":"No pudimos procesar este turno."},statuses[code]??500);}}
