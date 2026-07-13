import { NextRequest } from "next/server";
import { jsonData,jsonError } from "@/lib/api/response";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingRoleplayService } from "@/lib/training/roleplay";
import { getTrainingServerSession } from "@/lib/training/server-auth";
export async function GET(request:NextRequest){const auth=await getTrainingServerSession(request);if(!auth)return jsonError({code:"UNAUTHORIZED",message:"Inicia sesión para consultar simulaciones."},401);return jsonData(await new TrainingRoleplayService(createServiceSupabaseClient()).catalog(auth.user.id));}
