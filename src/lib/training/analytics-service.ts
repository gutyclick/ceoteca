import type { SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import {
  learningEventInputSchema,
  learningEventPropertiesSchema,
  serverOnlyLearningEvents,
  type LearningEventName,
} from "@/lib/training/analytics-schemas";
import { auditEditorial } from "@/lib/training/editorial-audit";
import {
  calculateExerciseAnalytics,
  calculateRetention,
  classifyDistractor,
  type MetricAttempt,
} from "@/lib/training/learning-metrics";

type EventInput = {
  clientEventId: string;
  eventName: LearningEventName;
  occurredAt?: string;
  sessionId?: string;
  sessionExerciseId?: string;
  exerciseId?: string;
  exerciseVersion?: number;
  templateId?: string;
  categoryId?: string;
  skillId?: string;
  conceptId?: string;
  attemptNumber?: number;
  properties?: Record<string, unknown>;
};

type ExerciseRelation = {
  exercise_id: string;
  exercise_snapshot: Record<string, unknown>;
};

type AnswerRow = {
  user_id: string;
  session_id: string;
  session_exercise_id: string;
  attempt_number: number;
  is_correct: boolean | null;
  score: number;
  normalized_score: number | null;
  hints_used: number;
  response_time_ms: number | null;
  answer: Record<string, unknown>;
  created_at: string;
  training_session_exercises: ExerciseRelation | ExerciseRelation[];
};

type VersionMetricRow = {
  exercise_id: string;
  exercise_version: number;
  sample_size: number;
  unique_users: number;
  metrics: Record<string, unknown>;
  quality_score: number | null;
  quality_status: string;
  observed_difficulty_status: string;
  evidence_status: string;
  period_end: string;
};

const relationOne = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

const startOfDay = (date: string) => `${date}T00:00:00.000Z`;
const nextDay = (date: string) => {
  const value = new Date(startOfDay(date));
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString();
};

export class AnalyticsPrivacyService {
  validateProperties(properties: unknown) {
    return learningEventPropertiesSchema.parse(properties ?? {});
  }

  assertCohortSize(size: number) {
    if (size < serverEnv.TRAINING_ANALYTICS_MIN_COHORT_SIZE)
      throw new Error("COHORT_TOO_SMALL");
  }
}

export class TrainingAnalyticsService {
  private readonly privacy = new AnalyticsPrivacyService();

  constructor(private readonly db: SupabaseClient) {}

  async recordClientEvent(userId: string, raw: unknown) {
    if (!serverEnv.TRAINING_LEARNING_ANALYTICS_ENABLED)
      return { accepted: false, reason: "disabled" as const };
    const input = learningEventInputSchema.parse(raw);
    if (serverOnlyLearningEvents.has(input.eventName)) throw new Error("SERVER_EVENT_REQUIRED");
    await this.assertOwnership(userId, input.sessionId, input.sessionExerciseId);
    return this.insert(userId, { ...input, properties: input.properties }, "client");
  }

  async recordServerEvent(userId: string, input: EventInput) {
    if (!serverEnv.TRAINING_LEARNING_ANALYTICS_ENABLED)
      return { accepted: false, reason: "disabled" as const };
    return this.insert(userId, {
      ...input,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      properties: this.privacy.validateProperties(input.properties),
    }, "server");
  }

  private async insert(userId: string, input: EventInput, source: "client" | "server") {
    const occurredAt = new Date(input.occurredAt ?? new Date().toISOString());
    if (Math.abs(Date.now() - occurredAt.getTime()) > 7 * 24 * 60 * 60 * 1000)
      throw new Error("EVENT_TIME_OUT_OF_RANGE");
    const properties = this.privacy.validateProperties(input.properties);
    const { error } = await this.db.from("training_learning_events").insert({
      user_id: userId,
      anonymous_id: null,
      event_name: input.eventName,
      session_id: input.sessionId ?? null,
      session_exercise_id: input.sessionExerciseId ?? null,
      exercise_id: input.exerciseId ?? null,
      exercise_version: input.exerciseVersion ?? null,
      template_id: input.templateId ?? null,
      category_id: input.categoryId ?? null,
      skill_id: input.skillId ?? null,
      concept_id: input.conceptId ?? null,
      attempt_number: input.attemptNumber ?? null,
      properties,
      occurred_at: occurredAt.toISOString(),
      client_event_id: input.clientEventId,
      source,
    });
    if (error?.code === "23505") return { accepted: true, duplicate: true };
    if (error) throw new Error("EVENT_INSERT_FAILED");
    return { accepted: true, duplicate: false };
  }

  private async assertOwnership(userId: string, sessionId?: string, sessionExerciseId?: string) {
    if (!sessionId && !sessionExerciseId) return;
    let query = this.db
      .from("training_sessions")
      .select("id,training_session_exercises(id)")
      .eq("user_id", userId);
    if (sessionId) query = query.eq("id", sessionId);
    if (sessionExerciseId)
      query = query.eq("training_session_exercises.id", sessionExerciseId);
    const { data } = await query.limit(1).maybeSingle();
    if (!data) throw new Error("EVENT_ENTITY_FORBIDDEN");
  }

  async dashboard(days = 30) {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const [metrics, alerts, experiments, retention, jobs] = await Promise.all([
      this.db.from("training_exercise_version_metrics").select("exercise_id,exercise_version,sample_size,unique_users,metrics,quality_score,quality_status,observed_difficulty_status,evidence_status,period_end").gte("period_end", since).order("period_end", { ascending: false }).limit(500),
      this.db.from("training_quality_alerts").select("id,alert_type,severity,entity_type,entity_id,explanation,recommendation,status,created_at").in("status", ["open", "acknowledged", "investigating"]).order("created_at", { ascending: false }).limit(8),
      this.db.from("training_experiments").select("id,name,status,primary_metric,start_at,end_at").in("status", ["approved", "scheduled", "running", "paused"]).order("created_at", { ascending: false }).limit(8),
      this.db.from("training_retention_metrics").select("concept_id,window_days,sample_size,retention_rate,data_status,period_end").gte("period_end", since).eq("window_days", 7).order("retention_rate", { ascending: true }).limit(8),
      this.db.from("training_analytics_jobs").select("status,processed_records,completed_at").order("started_at", { ascending: false }).limit(1),
    ]);
    const latest = new Map<string, VersionMetricRow>();
    for (const metric of (metrics.data ?? []) as VersionMetricRow[])
      if (!latest.has(metric.exercise_id)) latest.set(metric.exercise_id, metric);
    const values = [...latest.values()];
    const statusCount = (status: string) => values.filter((metric) => metric.quality_status === status).length;
    return {
      periodDays: days,
      volume: {
        exercises: values.length,
        attempts: values.reduce((sum, metric) => sum + Number(metric.sample_size), 0),
        uniqueUsers: values.reduce((sum, metric) => sum + Number(metric.unique_users), 0),
      },
      quality: {
        healthy: statusCount("healthy"),
        monitor: statusCount("monitor"),
        needsReview: statusCount("needs_review"),
        highRisk: statusCount("high_risk"),
        insufficientData: statusCount("insufficient_data"),
      },
      alerts: alerts.data ?? [],
      experiments: experiments.data ?? [],
      lowRetention: retention.data ?? [],
      latestAggregation: jobs.data?.[0] ?? null,
    };
  }

  async exercises(days = 30, limit = 50) {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const { data: metrics } = await this.db
      .from("training_exercise_version_metrics")
      .select("exercise_id,exercise_version,sample_size,unique_users,metrics,quality_score,quality_status,observed_difficulty_status,evidence_status,period_end")
      .gte("period_end", since)
      .order("period_end", { ascending: false })
      .limit(limit * 3);
    const ids = [...new Set((metrics ?? []).map((metric) => metric.exercise_id))].slice(0, limit);
    const { data: exercises } = ids.length
      ? await this.db.from("training_exercises").select("id,title,prompt,type,difficulty,status,version,cognitive_level,skill_id,concept_id").in("id", ids)
      : { data: [] };
    const exerciseMap = new Map((exercises ?? []).map((exercise) => [exercise.id, exercise]));
    const seen = new Set<string>();
    return (metrics ?? []).flatMap((metric) => {
      if (seen.has(metric.exercise_id)) return [];
      seen.add(metric.exercise_id);
      return [{ ...metric, exercise: exerciseMap.get(metric.exercise_id) ?? null }];
    });
  }

  async exerciseDetail(exerciseId: string) {
    const [exercise, versions, distractors, feedback, alerts] = await Promise.all([
      this.db.from("training_exercises").select("id,title,prompt,instruction,type,difficulty,status,version,cognitive_level,skill_id,concept_id,created_at,updated_at").eq("id", exerciseId).maybeSingle(),
      this.db.from("training_exercise_version_metrics").select("*").eq("exercise_id", exerciseId).order("period_end", { ascending: false }).limit(20),
      this.db.from("training_distractor_metrics").select("*").eq("exercise_id", exerciseId).order("period_end", { ascending: false }).limit(50),
      this.db.from("training_feedback_metrics").select("*").eq("exercise_id", exerciseId).order("period_end", { ascending: false }).limit(20),
      this.db.from("training_quality_alerts").select("*").eq("entity_id", exerciseId).order("created_at", { ascending: false }).limit(20),
    ]);
    if (!exercise.data) throw new Error("EXERCISE_NOT_FOUND");
    return {
      exercise: exercise.data,
      versions: versions.data ?? [],
      distractors: distractors.data ?? [],
      feedback: feedback.data ?? [],
      alerts: alerts.data ?? [],
    };
  }
}

export class LearningMetricsService {
  constructor(private readonly db: SupabaseClient) {}

  async aggregateDay(metricDate: string) {
    if (!serverEnv.TRAINING_LEARNING_ANALYTICS_ENABLED) return { processed: 0, disabled: true };
    const started = Date.now();
    const { data: existingJob } = await this.db.from("training_analytics_jobs").select("id,status").eq("job_type", "daily_learning").eq("period_start", metricDate).eq("period_end", metricDate).maybeSingle();
    if (existingJob?.status === "completed") return { processed: 0, idempotent: true };
    const { data: job } = existingJob
      ? await this.db.from("training_analytics_jobs").update({ status: "running", started_at: new Date().toISOString(), error_code: null }).eq("id", existingJob.id).select("id").single()
      : await this.db.from("training_analytics_jobs").insert({ job_type: "daily_learning", period_start: metricDate, period_end: metricDate }).select("id").single();
    try {
      const [answerResponse, eventResponse, exerciseResponse] = await Promise.all([
        this.db.from("training_answers").select("user_id,session_id,session_exercise_id,attempt_number,is_correct,score,normalized_score,hints_used,response_time_ms,answer,created_at,training_session_exercises!inner(exercise_id,exercise_snapshot)").gte("created_at", startOfDay(metricDate)).lt("created_at", nextDay(metricDate)),
        this.db.from("training_learning_events").select("user_id,event_name,exercise_id,exercise_version,attempt_number,properties,occurred_at").gte("occurred_at", startOfDay(metricDate)).lt("occurred_at", nextDay(metricDate)),
        this.db.from("training_exercises").select("id,version,cognitive_level,type,content"),
      ]);
      if (answerResponse.error || eventResponse.error) throw new Error("AGGREGATION_READ_FAILED");
      const exercises = new Map((exerciseResponse.data ?? []).map((exercise) => [exercise.id, exercise]));
      const answers = (answerResponse.data ?? []) as unknown as AnswerRow[];
      const grouped = new Map<string, AnswerRow[]>();
      for (const answer of answers) {
        const relation = relationOne(answer.training_session_exercises);
        if (!relation) continue;
        const exercise = exercises.get(relation.exercise_id);
        if (!exercise) continue;
        const key = `${exercise.id}:${exercise.version}`;
        grouped.set(key, [...(grouped.get(key) ?? []), answer]);
      }
      const rows: Record<string, unknown>[] = [];
      for (const [key, exerciseAnswers] of grouped) {
        const [exerciseId, versionText] = key.split(":");
        const exercise = exercises.get(exerciseId);
        if (!exercise) continue;
        const relatedEvents = (eventResponse.data ?? []).filter((event) => event.exercise_id === exerciseId);
        const masteryByAttempt = new Map<string, MetricAttempt["masteryBefore"]>();
        relatedEvents.filter((event) => event.event_name === "exercise_answer_evaluated").forEach((event) => {
          const properties = event.properties as Record<string, unknown>;
          masteryByAttempt.set(`${event.user_id ?? ""}:${event.attempt_number ?? ""}`, (properties.mastery_before_bucket as MetricAttempt["masteryBefore"]) ?? "unknown");
        });
        const metricAttempts: MetricAttempt[] = exerciseAnswers.map((answer) => ({
          userId: answer.user_id,
          attemptNumber: answer.attempt_number,
          score: Number(answer.normalized_score ?? Number(answer.score) / 100),
          isCorrect: answer.is_correct === true,
          hintsUsed: answer.hints_used,
          responseTimeMs: answer.response_time_ms,
          masteryBefore: masteryByAttempt.get(`${answer.user_id}:${answer.attempt_number}`) ?? "unknown",
          occurredAt: answer.created_at,
          cognitiveLevel: exercise.cognitive_level as MetricAttempt["cognitiveLevel"],
        }));
        const count = (name: string) => relatedEvents.filter((event) => event.event_name === name).length;
        const analytics = calculateExerciseAnalytics(metricAttempts, {
          viewedCount: count("exercise_viewed"),
          abandonedCount: count("exercise_abandoned"),
          solutionViews: count("exercise_solution_viewed"),
          helpfulFeedback: count("feedback_helpful"),
          unhelpfulFeedback: count("feedback_not_helpful"),
        }, serverEnv.TRAINING_ANALYTICS_MIN_ATTEMPTS, serverEnv.TRAINING_ANALYTICS_MIN_USERS);
        rows.push({
          exercise_id: exerciseId,
          exercise_version: Number(versionText),
          metric_date: metricDate,
          attempts: analytics.attempts,
          unique_users: analytics.uniqueUsers,
          viewed_count: count("exercise_viewed"),
          completed_count: count("exercise_answer_evaluated"),
          abandoned_count: count("exercise_abandoned"),
          first_attempt_accuracy: analytics.firstAttemptAccuracy,
          eventual_accuracy: analytics.eventualAccuracy,
          retry_success_rate: analytics.retrySuccessRate,
          hint_usage_rate: analytics.hintUsageRate,
          solution_view_rate: analytics.solutionViewRate,
          abandonment_rate: analytics.abandonmentRate,
          median_response_time_ms: analytics.medianResponseTimeMs,
          p90_response_time_ms: analytics.p90ResponseTimeMs,
          average_score: analytics.averageScore,
          transfer_score: analytics.transferScore,
          discrimination_index: analytics.discriminationIndex,
          ambiguity_risk_score: analytics.ambiguityRiskScore,
          observed_difficulty_score: analytics.observedDifficultyScore,
          observed_difficulty_status: analytics.observedDifficultyStatus,
          quality_score: analytics.qualityScore,
          quality_status: analytics.qualityStatus,
          quality_breakdown: analytics.qualityBreakdown,
          data_status: analytics.dataStatus,
          calculated_at: new Date().toISOString(),
        });
        await this.aggregateDistractors(exerciseId, Number(versionText), metricDate, exerciseAnswers, exercise.content as Record<string, unknown>);
      }
      if (rows.length) {
        const { error } = await this.db.from("training_exercise_daily_metrics").upsert(rows, { onConflict: "exercise_id,exercise_version,metric_date" });
        if (error) throw new Error("AGGREGATION_WRITE_FAILED");
        await this.db.from("training_exercise_version_metrics").upsert(rows.map((row) => ({
          exercise_id: row.exercise_id,
          exercise_version: row.exercise_version,
          period_start: metricDate,
          period_end: metricDate,
          sample_size: row.attempts,
          unique_users: row.unique_users,
          metrics: row,
          quality_score: row.quality_score,
          quality_status: row.quality_status,
          observed_difficulty_status: row.observed_difficulty_status,
          evidence_status: row.data_status,
          calculated_at: new Date().toISOString(),
        })), { onConflict: "exercise_id,exercise_version,period_start,period_end" });
      }
      await new QualityAlertService(this.db).refreshForRows(rows);
      await this.aggregateRetention(metricDate);
      if (job) await this.db.from("training_analytics_jobs").update({ status: "completed", processed_records: answers.length, duration_ms: Date.now() - started, completed_at: new Date().toISOString() }).eq("id", job.id);
      return { processed: answers.length, exercises: rows.length };
    } catch (error) {
      if (job) await this.db.from("training_analytics_jobs").update({ status: "failed", error_code: error instanceof Error ? error.message : "AGGREGATION_FAILED", duration_ms: Date.now() - started, completed_at: new Date().toISOString() }).eq("id", job.id);
      throw error;
    }
  }

  private async aggregateDistractors(exerciseId: string, version: number, date: string, answers: AnswerRow[], content: Record<string, unknown>) {
    const options = Array.isArray(content.options) ? content.options as Array<{ id?: string }> : [];
    if (!options.length) return;
    const firstAnswers = answers.filter((answer) => answer.attempt_number === 1);
    const selected = (answer: AnswerRow) => {
      const value = answer.answer;
      if (typeof value.optionId === "string") return [value.optionId];
      return Array.isArray(value.optionIds) ? value.optionIds.filter((item): item is string => typeof item === "string") : [];
    };
    const rows = options.map((option) => {
      const count = firstAnswers.filter((answer) => selected(answer).includes(option.id ?? "")).length;
      const selectionRate = firstAnswers.length ? count / firstAnswers.length : 0;
      return {
        exercise_id: exerciseId,
        exercise_version: version,
        option_id: option.id ?? "unknown",
        period_start: date,
        period_end: date,
        selections: count,
        total_attempts: firstAnswers.length,
        selection_rate: selectionRate,
        selected_by_high_mastery: null,
        selected_by_low_mastery: null,
        retry_selection_rate: answers.length ? answers.filter((answer) => answer.attempt_number > 1 && selected(answer).includes(option.id ?? "")).length / answers.length : 0,
        suspected_issue: classifyDistractor({ selectionRate, highMasteryRate: 0, lowMasteryRate: 0, sampleSize: firstAnswers.length, minimumSample: serverEnv.TRAINING_ANALYTICS_MIN_ATTEMPTS }),
        calculated_at: new Date().toISOString(),
      };
    });
    await this.db.from("training_distractor_metrics").upsert(rows, { onConflict: "exercise_id,exercise_version,option_id,period_start,period_end" });
  }

  private async aggregateRetention(metricDate: string) {
    if (!serverEnv.TRAINING_RETENTION_ANALYTICS_ENABLED) return;
    const since = new Date(startOfDay(metricDate));
    since.setUTCDate(since.getUTCDate() - 31);
    const { data } = await this.db.from("training_answers").select("user_id,score,normalized_score,created_at,training_session_exercises!inner(exercise_id,training_exercises!inner(concept_id))").gte("created_at", since.toISOString()).lt("created_at", nextDay(metricDate));
    type RetentionRow = { user_id: string; score: number; normalized_score: number | null; created_at: string; training_session_exercises: { training_exercises: { concept_id: string } | Array<{ concept_id: string }> } | Array<{ training_exercises: { concept_id: string } | Array<{ concept_id: string }> }> };
    const groups = new Map<string, RetentionRow[]>();
    for (const row of (data ?? []) as unknown as RetentionRow[]) {
      const se = relationOne(row.training_session_exercises);
      const exercise = relationOne(se?.training_exercises);
      if (!exercise) continue;
      groups.set(exercise.concept_id, [...(groups.get(exercise.concept_id) ?? []), row]);
    }
    const rows: Record<string, unknown>[] = [];
    for (const [conceptId, values] of groups) {
      for (const windowDays of [1, 3, 7, 14, 30]) {
        const byUser = new Map<string, RetentionRow[]>();
        values.forEach((value) => byUser.set(value.user_id, [...(byUser.get(value.user_id) ?? []), value]));
        const immediate: number[] = [];
        const delayed: number[] = [];
        for (const userValues of byUser.values()) {
          const sorted = userValues.sort((a, b) => a.created_at.localeCompare(b.created_at));
          const first = sorted[0];
          const later = sorted.find((value) => (new Date(value.created_at).getTime() - new Date(first.created_at).getTime()) >= windowDays * 86_400_000);
          if (!later) continue;
          immediate.push(Number(first.normalized_score ?? Number(first.score) / 100));
          delayed.push(Number(later.normalized_score ?? Number(later.score) / 100));
        }
        const metric = calculateRetention(immediate, delayed, serverEnv.TRAINING_ANALYTICS_MIN_USERS);
        rows.push({ concept_id: conceptId, window_days: windowDays, period_start: since.toISOString().slice(0, 10), period_end: metricDate, sample_size: delayed.length, immediate_accuracy: metric.immediateAccuracy, delayed_accuracy: metric.delayedAccuracy, retention_rate: metric.retentionRate, retention_decay: metric.retentionDecay, data_status: metric.dataStatus, calculated_at: new Date().toISOString() });
      }
    }
    if (rows.length) await this.db.from("training_retention_metrics").upsert(rows, { onConflict: "concept_id,window_days,period_start,period_end" });
  }
}

export class ExerciseQualityService {
  constructor(private readonly db: SupabaseClient) {}
  detail(exerciseId: string) {
    return new TrainingAnalyticsService(this.db).exerciseDetail(exerciseId);
  }
}

export class RetentionAnalyticsService {
  constructor(private readonly db: SupabaseClient) {}
  async list(limit = 100) {
    const { data } = await this.db.from("training_retention_metrics").select("*").order("period_end", { ascending: false }).limit(limit);
    return data ?? [];
  }
}

export class TransferAnalyticsService {
  constructor(private readonly db: SupabaseClient) {}
  async list(limit = 100) {
    const { data } = await this.db.from("training_exercise_version_metrics").select("exercise_id,exercise_version,sample_size,metrics,period_end").not("metrics->transfer_score", "is", null).order("period_end", { ascending: false }).limit(limit);
    return data ?? [];
  }
}

export class DistractorAnalyticsService {
  constructor(private readonly db: SupabaseClient) {}
  async list(exerciseId: string) {
    const { data } = await this.db.from("training_distractor_metrics").select("*").eq("exercise_id", exerciseId).order("period_end", { ascending: false });
    return data ?? [];
  }
}

export class FeedbackAnalyticsService {
  constructor(private readonly db: SupabaseClient) {}
  async list(exerciseId: string) {
    const { data } = await this.db.from("training_feedback_metrics").select("*").eq("exercise_id", exerciseId).order("period_end", { ascending: false });
    return data ?? [];
  }
}

export class QualityAlertService {
  constructor(private readonly db: SupabaseClient) {}

  async refreshForRows(rows: Record<string, unknown>[]) {
    if (!serverEnv.TRAINING_QUALITY_ALERTS_ENABLED) return;
    for (const row of rows) {
      const alerts: Array<{ type: string; severity: string; explanation: string; recommendation: string }> = [];
      if (row.data_status !== "sufficient") continue;
      if (Number(row.first_attempt_accuracy) < 0.35) alerts.push({ type: "low_accuracy", severity: "high", explanation: "La precisión inicial está por debajo del rango esperado.", recommendation: "Revisa claridad, alineación conceptual y respuesta correcta." });
      if (Number(row.first_attempt_accuracy) > 0.95) alerts.push({ type: "excessive_accuracy", severity: "warning", explanation: "La pregunta puede ser demasiado evidente.", recommendation: "Comprueba si el ejercicio discrimina comprensión real." });
      if (Number(row.abandonment_rate) > 0.3) alerts.push({ type: "high_abandonment", severity: "high", explanation: "El abandono supera el umbral configurado.", recommendation: "Revisa longitud, instrucciones y carga cognitiva." });
      if (Number(row.hint_usage_rate) > 0.45) alerts.push({ type: "excessive_hint_usage", severity: "warning", explanation: "El uso de pistas es elevado.", recommendation: "Aclara el enunciado o prepara mejor el concepto." });
      if (Number(row.discrimination_index) < 0) alerts.push({ type: "negative_discrimination", severity: "critical", explanation: "Usuarios con mayor dominio rinden peor que los de dominio bajo.", recommendation: "Comprueba ambigüedad, distractores y clave correcta antes de crear una versión." });
      for (const alert of alerts) {
        const { data: existing } = await this.db
          .from("training_quality_alerts")
          .select("id")
          .eq("alert_type", alert.type)
          .eq("entity_type", "exercise")
          .eq("entity_id", String(row.exercise_id))
          .eq("entity_version", Number(row.exercise_version))
          .in("status", ["open", "acknowledged", "investigating"])
          .limit(1)
          .maybeSingle();
        if (!existing)
          await this.db.from("training_quality_alerts").insert({ alert_type: alert.type, severity: alert.severity, entity_type: "exercise", entity_id: row.exercise_id, entity_version: row.exercise_version, related_metrics: row, explanation: alert.explanation, recommendation: alert.recommendation, status: "open" });
      }
    }
  }

  async list(status?: string) {
    let query = this.db.from("training_quality_alerts").select("*").order("created_at", { ascending: false }).limit(100);
    if (status) query = query.eq("status", status);
    const { data } = await query;
    return data ?? [];
  }

  async transition(alertId: string, actorId: string, action: "acknowledge" | "investigate" | "resolve" | "dismiss", note?: string) {
    const status = { acknowledge: "acknowledged", investigate: "investigating", resolve: "resolved", dismiss: "dismissed" }[action];
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (action === "acknowledge") Object.assign(patch, { acknowledged_by: actorId, acknowledged_at: now });
    if (action === "resolve" || action === "dismiss") Object.assign(patch, { resolved_by: actorId, resolved_at: now, resolution_note: note ?? null });
    const { data, error } = await this.db.from("training_quality_alerts").update(patch).eq("id", alertId).select("id,status").single();
    if (error || !data) throw new Error("ALERT_UPDATE_FAILED");
    await auditEditorial(this.db, { actorId, action: `quality_alert_${status}`, entityType: "quality_alert", entityId: alertId, metadata: { note: note ? "provided" : "none" } });
    return data;
  }
}
