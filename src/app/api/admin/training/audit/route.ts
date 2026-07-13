import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "audit");
  if (!access)
    return jsonError(
      {
        code: "FORBIDDEN",
        message: "Solo administradores pueden consultar la auditoría.",
      },
      403,
    );
  const { data } = await access.service
    .from("training_editorial_audit_log")
    .select(
      "id,actor_id,action,entity_type,entity_id,entity_version,metadata,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return jsonData(data ?? []);
}
