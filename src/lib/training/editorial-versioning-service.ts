import type { SupabaseClient } from "@supabase/supabase-js";

import { TrainingAuditService } from "@/lib/training/editorial-audit-service";

type VersionStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived"
  | "changes_requested";

export type EditorialVersion = {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  status: VersionStatus;
  snapshot: Record<string, unknown>;
  change_reason: string | null;
  created_at: string;
};

export class TrainingVersioningService {
  private readonly audit: TrainingAuditService;

  constructor(
    private readonly db: SupabaseClient,
    private readonly actorId: string,
  ) {
    this.audit = new TrainingAuditService(db, actorId);
  }

  async history(entityType: string, entityId: string) {
    const { data, error } = await this.db
      .from("training_editorial_versions")
      .select(
        "id,entity_type,entity_id,version,status,change_reason,created_at,published_at",
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("version", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async latestDraft(entityType: string, entityId: string) {
    const { data, error } = await this.db
      .from("training_editorial_versions")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .in("status", ["draft", "changes_requested", "in_review", "approved"])
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as EditorialVersion | null;
  }

  async createDraft(input: {
    entityType: string;
    entityId: string;
    snapshot: Record<string, unknown>;
    reason?: string;
  }) {
    const current = await this.latestDraft(input.entityType, input.entityId);
    if (
      current?.status === "draft" ||
      current?.status === "changes_requested"
    ) {
      const { data, error } = await this.db
        .from("training_editorial_versions")
        .update({
          snapshot: input.snapshot,
          change_reason: input.reason ?? current.change_reason,
        })
        .eq("id", current.id)
        .select("*")
        .single();
      if (error) throw error;
      await this.audit.record({
        action: "editorial_draft_autosaved",
        entityType: input.entityType,
        entityId: input.entityId,
        version: current.version,
      });
      return data as EditorialVersion;
    }
    const { data: maxVersion, error: maxError } = await this.db
      .from("training_editorial_versions")
      .select("version")
      .eq("entity_type", input.entityType)
      .eq("entity_id", input.entityId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxError) throw maxError;
    const version = Number(maxVersion?.version ?? 0) + 1;
    const { data, error } = await this.db
      .from("training_editorial_versions")
      .insert({
        entity_type: input.entityType,
        entity_id: input.entityId,
        version,
        status: "draft",
        snapshot: input.snapshot,
        change_reason: input.reason ?? null,
        created_by: this.actorId,
      })
      .select("*")
      .single();
    if (error) throw error;
    await this.audit.record({
      action: "editorial_version_created",
      entityType: input.entityType,
      entityId: input.entityId,
      version,
    });
    return data as EditorialVersion;
  }

  async transition(
    versionId: string,
    status: Exclude<VersionStatus, "draft" | "published">,
    reason?: string,
  ) {
    const { data: current, error: currentError } = await this.db
      .from("training_editorial_versions")
      .select("status")
      .eq("id", versionId)
      .single();
    if (currentError || !current)
      throw currentError ?? new Error("VERSION_NOT_FOUND");
    const allowed: Record<string, VersionStatus[]> = {
      draft: ["in_review"],
      changes_requested: ["in_review"],
      in_review: ["approved", "changes_requested"],
      approved: ["changes_requested"],
    };
    if (!allowed[current.status]?.includes(status))
      throw new Error("INVALID_VERSION_TRANSITION");
    const updates: Record<string, unknown> = {
      status,
      change_reason: reason ?? null,
    };
    if (status === "approved")
      Object.assign(updates, {
        reviewed_by: this.actorId,
        reviewed_at: new Date().toISOString(),
      });
    const { data, error } = await this.db
      .from("training_editorial_versions")
      .update(updates)
      .eq("id", versionId)
      .neq("status", "published")
      .select("*")
      .single();
    if (error) throw error;
    await this.audit.record({
      action: `editorial_${status}`,
      entityType: data.entity_type,
      entityId: data.entity_id,
      version: data.version,
    });
    return data as EditorialVersion;
  }

  async markPublished(versionId: string) {
    const { data, error } = await this.db
      .from("training_editorial_versions")
      .update({
        status: "published",
        published_by: this.actorId,
        published_at: new Date().toISOString(),
      })
      .eq("id", versionId)
      .eq("status", "approved")
      .select("*")
      .single();
    if (error) throw error;
    await this.audit.record({
      action: "editorial_content_published",
      entityType: data.entity_type,
      entityId: data.entity_id,
      version: data.version,
    });
    return data as EditorialVersion;
  }

  async restore(versionId: string, reason: string) {
    const { data, error } = await this.db
      .from("training_editorial_versions")
      .select("*")
      .eq("id", versionId)
      .single();
    if (error || !data) throw error ?? new Error("VERSION_NOT_FOUND");
    if (data.status !== "published")
      throw new Error("ONLY_PUBLISHED_VERSIONS_CAN_BE_RESTORED");
    return this.createDraft({
      entityType: data.entity_type,
      entityId: data.entity_id,
      snapshot: data.snapshot as Record<string, unknown>,
      reason,
    });
  }
}
