import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { LearningEventName } from "@/lib/training/analytics-schemas";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";
import { auditEditorial } from "@/lib/training/editorial-audit";

const analyticsActions = new Set<LearningEventName>([
  "editorial_taxonomy_created",
  "editorial_taxonomy_updated",
  "editorial_path_updated",
  "editorial_validation_failed",
  "editorial_content_published",
]);

export class TrainingAuditService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly actorId: string,
  ) {}

  async record(input: {
    action: string;
    entityType: string;
    entityId?: string;
    version?: number;
    metadata?: Record<string, unknown>;
  }) {
    await auditEditorial(this.db, { actorId: this.actorId, ...input });

    if (!analyticsActions.has(input.action as LearningEventName)) return;
    const relation =
      input.entityType === "category"
        ? { categoryId: input.entityId }
        : input.entityType === "skill"
          ? { skillId: input.entityId }
          : input.entityType === "concept"
            ? { conceptId: input.entityId }
            : {};
    try {
      await new TrainingAnalyticsService(this.db).recordServerEvent(
        this.actorId,
        {
          clientEventId: randomUUID(),
          eventName: input.action as LearningEventName,
          ...relation,
        },
      );
    } catch {
      // La auditoría editorial es autoritativa; la analítica nunca bloquea la edición.
    }
  }
}
