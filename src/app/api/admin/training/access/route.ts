import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { jsonData, jsonError } from "@/lib/api/response";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getTrainingServerSession } from "@/lib/training/server-auth";

export async function GET(request: NextRequest) {
  const auth = await getTrainingServerSession(request);
  if (!auth) {
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso a esta sección." },
      403,
    );
  }

  const service = createServiceSupabaseClient() as unknown as SupabaseClient;
  const { data: editorialUser } = await service
    .from("training_editorial_users")
    .select("role,is_active")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!editorialUser?.is_active) {
    await service.from("training_editorial_audit_log").insert({
      actor_id: auth.user.id,
      action: "unauthorized_access_attempt",
      entity_type: "admin_panel",
      metadata: { path: "/admin/training" },
    });
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso a esta sección." },
      403,
    );
  }

  return jsonData({ authorized: true, role: editorialUser.role });
}
