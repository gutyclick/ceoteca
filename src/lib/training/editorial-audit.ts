import type { SupabaseClient } from "@supabase/supabase-js";
export async function auditEditorial(
  db: SupabaseClient,
  input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    version?: number;
    metadata?: Record<string, unknown>;
  },
) {
  await db
    .from("training_editorial_audit_log")
    .insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_version: input.version ?? null,
      metadata: input.metadata ?? {},
    });
}
