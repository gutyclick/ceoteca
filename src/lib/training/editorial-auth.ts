import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import {
  canEditorial,
  type EditorialAction,
  type EditorialRole,
} from "@/lib/training/editorial-permissions";

export async function requireEditorialAccess(
  request: NextRequest,
  action: EditorialAction,
) {
  const auth = await getTrainingServerSession(request);
  if (!auth) return null;
  const service = createServiceSupabaseClient() as unknown as SupabaseClient;
  const { data } = await service
    .from("training_editorial_users")
    .select("role,is_active")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!data?.is_active || !canEditorial(data.role as EditorialRole, action))
    return null;
  return { userId: auth.user.id, role: data.role as EditorialRole, service };
}
