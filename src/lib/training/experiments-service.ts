import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import { experimentCreateSchema } from "@/lib/training/analytics-schemas";
import { auditEditorial } from "@/lib/training/editorial-audit";

export class ExperimentAssignmentService {
  constructor(private readonly db: SupabaseClient) {}

  async assign(experimentId: string, userId: string, isAdult: boolean) {
    if (!serverEnv.TRAINING_EXPERIMENTS_ENABLED || !isAdult) return null;
    const { data: existing } = await this.db.from("training_experiment_assignments").select("variant_id").eq("experiment_id", experimentId).eq("user_id", userId).maybeSingle();
    if (existing) return existing.variant_id;
    const [{ data: experiment }, { data: variants }] = await Promise.all([
      this.db.from("training_experiments").select("id,status,eligibility").eq("id", experimentId).maybeSingle(),
      this.db.from("training_experiment_variants").select("id,weight").eq("experiment_id", experimentId).order("created_at"),
    ]);
    if (experiment?.status !== "running" || !variants?.length) return null;
    const digest = createHmac("sha256", serverEnv.TRAINING_EXPERIMENT_SALT ?? "ceoteca-training-experiments-local-only").update(`${experimentId}:${userId}`).digest();
    const bucket = digest.readUInt32BE(0) % 100;
    let cumulative = 0;
    const selected = variants.find((variant) => (cumulative += Number(variant.weight)) > bucket) ?? variants[variants.length - 1];
    const { error } = await this.db.from("training_experiment_assignments").insert({ experiment_id: experimentId, variant_id: selected.id, user_id: userId, assignment_bucket: bucket, eligibility_snapshot: { adult: true } });
    if (error?.code !== "23505" && error) throw new Error("EXPERIMENT_ASSIGNMENT_FAILED");
    return selected.id;
  }
}

export class TrainingExperimentService {
  constructor(private readonly db: SupabaseClient) {}

  async list() {
    const { data } = await this.db.from("training_experiments").select("*,training_experiment_variants(*)").order("created_at", { ascending: false });
    return data ?? [];
  }

  async create(raw: unknown, actorId: string) {
    const input = experimentCreateSchema.parse(raw);
    const { variants } = input;
    const { data, error } = await this.db.from("training_experiments").insert({ name: input.name, description: input.description, hypothesis: input.hypothesis, entity_type: input.entityType, entity_id: input.entityId ?? null, primary_metric: input.primaryMetric, secondary_metrics: input.secondaryMetrics, guardrail_metrics: input.guardrailMetrics, eligibility: input.targetAudience, traffic_percentage: input.trafficPercentage, minimum_sample_size: input.minimumSampleSize, start_at: input.startAt ?? null, end_at: input.endAt ?? null, created_by: actorId, status: "draft" }).select("id").single();
    if (error || !data) throw new Error("EXPERIMENT_CREATE_FAILED");
    await this.db.from("training_experiment_variants").insert(variants.map((variant) => ({ experiment_id: data.id, key: variant.key, name: variant.name, weight: variant.weight, configuration: variant.configuration, is_control: variant.isControl })));
    await auditEditorial(this.db, { actorId, action: "experiment_created", entityType: "experiment", entityId: data.id, metadata: { primaryMetric: input.primaryMetric } });
    return data;
  }

  async transition(id: string, actorId: string, action: "submit" | "approve" | "start" | "pause" | "complete" | "cancel") {
    const status = { submit: "in_review", approve: "approved", start: "running", pause: "paused", complete: "completed", cancel: "cancelled" }[action];
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (action === "approve") Object.assign(patch, { approved_by: actorId, approved_at: new Date().toISOString() });
    const { data, error } = await this.db.from("training_experiments").update(patch).eq("id", id).select("id,status").single();
    if (error || !data) throw new Error("EXPERIMENT_UPDATE_FAILED");
    await auditEditorial(this.db, { actorId, action: `experiment_${action}`, entityType: "experiment", entityId: id });
    return data;
  }
}
