import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlanKey } from "@/config/plans";
import { serverEnv } from "@/lib/env";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";
import {
  buildRoleplayCharacterPrompt,
  buildRoleplayEvaluationPrompt,
} from "@/lib/training/roleplay-prompts";
import { TrainingRoleplayProvider } from "@/lib/training/roleplay-provider";
import { inspectRoleplayMessage } from "@/lib/training/roleplay-security";
import type { RoleplayDifficulty } from "@/lib/training/roleplay-schemas";

type JsonObject = Record<string, unknown>;
type MessageRow = {
  id: string;
  role: "user" | "character" | "system_summary";
  content: string;
  turn_number: number;
  created_at: string;
};

const activeStatuses = ["opening", "ready", "active", "paused"];

export function roleplayEntitlement(plan: PlanKey, used: number) {
  const isPro =
    (plan === "pro" || plan === "founder") &&
    serverEnv.TRAINING_ROLEPLAY_PRO_ENABLED;
  const unlimited =
    plan === "unlimited" && serverEnv.TRAINING_ROLEPLAY_UNLIMITED_ENABLED;
  const monthlyLimit = isPro
    ? serverEnv.TRAINING_ROLEPLAY_PRO_MONTHLY_LIMIT
    : unlimited
      ? null
      : 0;
  const levels: RoleplayDifficulty[] = unlimited
    ? [
        "fundamentals",
        "application",
        ...(serverEnv.TRAINING_ROLEPLAY_ADVANCED_ENABLED
          ? ["advanced" as const]
          : []),
        ...(serverEnv.TRAINING_ROLEPLAY_EXPERT_ENABLED
          ? ["expert" as const]
          : []),
      ]
    : isPro
      ? ["fundamentals", "application"]
      : [];
  return {
    canStart:
      serverEnv.TRAINING_ROLEPLAY_ENABLED &&
      (unlimited || (isPro && used < (monthlyLimit ?? 0))),
    monthlyLimit,
    remaining: monthlyLimit === null ? null : Math.max(0, monthlyLimit - used),
    levels,
    customScenarios:
      unlimited && serverEnv.TRAINING_ROLEPLAY_CUSTOM_SCENARIOS_ENABLED,
    unlimited,
  };
}

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function safeJson(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function buildConversationSummary(
  previous: string,
  userMessage: string,
  characterMessage: string,
) {
  const latest = `Usuario: ${userMessage}\nPersonaje: ${characterMessage}`;
  return [previous.trim(), latest].filter(Boolean).join("\n").slice(-2400);
}

export class TrainingRoleplayService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly provider = new TrainingRoleplayProvider(),
  ) {}

  private async event(
    userId: string,
    eventName: string,
    properties: Record<string, unknown> = {},
  ) {
    await this.db.from("training_learning_events").insert({
      user_id: userId,
      event_name: eventName,
      properties,
      occurred_at: new Date().toISOString(),
      client_event_id: crypto.randomUUID(),
      source: "server",
    });
  }

  private async applySkillMastery(
    userId: string,
    scenarioId: string,
    score: number,
  ) {
    const { data: scenario } = await this.db
      .from("training_roleplay_scenarios")
      .select("skill_slugs")
      .eq("id", scenarioId)
      .maybeSingle();
    const slugs = Array.isArray(scenario?.skill_slugs)
      ? scenario.skill_slugs
      : [];
    if (slugs.length === 0) return;
    const { data: skills } = await this.db
      .from("training_skills")
      .select("id,slug")
      .in("slug", slugs);
    for (const skill of skills ?? []) {
      const { data: current } = await this.db
        .from("user_skill_mastery")
        .select("mastery_score,total_attempts,correct_attempts")
        .eq("user_id", userId)
        .eq("skill_id", skill.id)
        .maybeSingle();
      const mastery = current
        ? Number(current.mastery_score) * 0.75 + score * 0.25
        : score * 0.25;
      const status =
        mastery >= 85
          ? "mastered"
          : mastery >= 70
            ? "competent"
            : mastery >= 40
              ? "developing"
              : "discovering";
      await this.db.from("user_skill_mastery").upsert(
        {
          user_id: userId,
          skill_id: skill.id,
          mastery_score: Number(mastery.toFixed(2)),
          status,
          total_attempts: Number(current?.total_attempts ?? 0) + 1,
          correct_attempts:
            Number(current?.correct_attempts ?? 0) + (score >= 70 ? 1 : 0),
          last_practiced_at: new Date().toISOString(),
          last_score: score,
          next_review_at: new Date(
            Date.now() + (score >= 70 ? 7 : 2) * 86400000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,skill_id" },
      );
    }
  }

  async access(userId: string) {
    const [subscription, usage] = await Promise.all([
      getEffectiveSubscriptionForUser(userId),
      this.db
        .from("training_roleplay_quota_consumptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("usage_month", monthStart())
        .eq("status", "consumed"),
    ]);
    return {
      plan: subscription.plan,
      ...roleplayEntitlement(subscription.plan, usage.count ?? 0),
    };
  }

  async quota(userId: string) {
    const access = await this.access(userId);
    return {
      plan: access.plan,
      canStart: access.canStart,
      monthlyLimit: access.monthlyLimit,
      remaining: access.unlimited ? null : access.remaining,
      unlimited: access.unlimited,
      resetsAt: new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1),
      ).toISOString(),
    };
  }

  async catalog(
    userId: string,
    filters?: { category?: string; difficulty?: string },
  ) {
    if (!serverEnv.TRAINING_ROLEPLAY_CATALOG_ENABLED)
      throw new Error("ROLEPLAY_CATALOG_DISABLED");
    const [access, categoriesResult, scenariosResult] = await Promise.all([
      this.access(userId),
      this.db
        .from("training_roleplay_categories")
        .select("id,slug,name,description,icon,skill_slugs,display_order")
        .eq("is_active", true)
        .order("display_order"),
      this.db
        .from("training_roleplay_scenarios")
        .select(
          "id,slug,public_title,short_description,category_id,level,minimum_plan,estimated_minutes,max_turns,skill_slugs,character_name",
        )
        .eq("status", "published")
        .eq("is_active", true)
        .order("created_at"),
    ]);
    const categories = (categoriesResult.data ?? []) as Array<
      JsonObject & { id: string; slug: string }
    >;
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const scenarios = (
      (scenariosResult.data ?? []) as Array<
        JsonObject & { category_id: string; level: RoleplayDifficulty }
      >
    )
      .filter((scenario) => {
        const category = categoryById.get(scenario.category_id);
        return (
          (!filters?.category || category?.slug === filters.category) &&
          (!filters?.difficulty || scenario.level === filters.difficulty)
        );
      })
      .map((scenario) => ({
        ...scenario,
        category: categoryById.get(scenario.category_id),
        canStart: access.canStart && access.levels.includes(scenario.level),
        lockedReason:
          access.plan === "free"
            ? "plan"
            : !access.levels.includes(scenario.level)
              ? "difficulty"
              : !access.canStart
                ? "quota"
                : null,
      }));
    const result = {
      enabled: serverEnv.TRAINING_ROLEPLAY_ENABLED,
      access: {
        plan: access.plan,
        canStart: access.canStart,
        remaining: access.unlimited ? null : access.remaining,
        monthlyLimit: access.monthlyLimit,
        unlimited: access.unlimited,
        levels: access.levels,
      },
      categories: categories.map((category) => ({
        ...category,
        scenarioCount: scenarios.filter(
          (scenario) => scenario.category_id === category.id,
        ).length,
      })),
      scenarios,
      alternatives: {
        deterministicExercisesHref: "/ejercicios",
        unlimitedPlanHref: "/planes",
      },
    };
    await this.event(userId, "roleplay_catalog_viewed", {
      category: filters?.category ?? null,
      difficulty: filters?.difficulty ?? null,
      plan: access.plan,
    });
    return result;
  }

  async scenario(userId: string, scenarioIdOrSlug: string) {
    const access = await this.access(userId);
    const query = this.db
      .from("training_roleplay_scenarios")
      .select(
        "id,slug,public_title,short_description,category_id,level,minimum_plan,estimated_minutes,max_turns,skill_slugs,character_name,learner_goal,current_version",
      )
      .eq("status", "published")
      .eq("is_active", true);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        scenarioIdOrSlug,
      );
    const result = isUuid
      ? await query.eq("id", scenarioIdOrSlug).maybeSingle()
      : await query.eq("slug", scenarioIdOrSlug).maybeSingle();
    if (!result.data) throw new Error("SCENARIO_NOT_FOUND");
    const scenario = result.data as JsonObject & {
      id: string;
      slug: string;
      public_title: string;
      category_id: string;
      level: RoleplayDifficulty;
      current_version: number;
      character_name: string;
      learner_goal: string;
      max_turns: number;
    };
    const [{ data: category }, { data: version }] = await Promise.all([
      this.db
        .from("training_roleplay_categories")
        .select("slug,name,description,icon")
        .eq("id", scenario.category_id)
        .single(),
      this.db
        .from("training_roleplay_scenario_versions")
        .select("id,public_config")
        .eq("scenario_id", scenario.id)
        .eq("version", scenario.current_version)
        .eq("status", "published")
        .single(),
    ]);
    return {
      ...scenario,
      category,
      publicConfig: safeJson(version?.public_config),
      scenarioVersionId: version?.id,
      canStart: access.canStart && access.levels.includes(scenario.level),
      access: {
        plan: access.plan,
        remaining: access.unlimited ? null : access.remaining,
        unlimited: access.unlimited,
      },
      lockedReason:
        access.plan === "free"
          ? "plan"
          : !access.levels.includes(scenario.level)
            ? "difficulty"
            : !access.canStart
              ? "quota"
              : null,
    };
  }

  async start(
    userId: string,
    input: {
      scenarioId: string;
      difficulty: RoleplayDifficulty;
      clientSessionId: string;
      pathItemId?: string;
    },
  ) {
    if (!serverEnv.TRAINING_ROLEPLAY_ENABLED)
      throw new Error("ROLEPLAY_DISABLED");
    const existing = await this.db
      .from("training_roleplay_sessions")
      .select("id,status")
      .eq("user_id", userId)
      .eq("client_consumption_id", input.clientSessionId)
      .maybeSingle();
    if (existing.data) return { sessionId: existing.data.id, idempotent: true };
    const access = await this.access(userId);
    if (!access.canStart)
      throw new Error(
        access.plan === "free" ? "PLAN_REQUIRED" : "MONTHLY_LIMIT_REACHED",
      );
    if (!access.levels.includes(input.difficulty))
      throw new Error("DIFFICULTY_LOCKED");
    const { count: concurrent } = await this.db
      .from("training_roleplay_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", activeStatuses);
    if (
      (concurrent ?? 0) >= serverEnv.TRAINING_ROLEPLAY_MAX_CONCURRENT_SESSIONS
    )
      throw new Error("CONCURRENT_LIMIT");
    const scenario = await this.scenario(userId, input.scenarioId);
    if (scenario.level !== input.difficulty)
      throw new Error("DIFFICULTY_NOT_AVAILABLE");
    let pathContext: { pathId: string; moduleId: string; itemId: string } | null = null;
    if (input.pathItemId) {
      const { data: pathItem, error: pathItemError } = await this.db
        .from("training_learning_path_module_items")
        .select("id,module_id,roleplay_scenario_id,training_learning_path_modules(path_id,status)")
        .eq("id", input.pathItemId)
        .eq("item_type", "roleplay")
        .maybeSingle();
      const moduleRelation = Array.isArray(pathItem?.training_learning_path_modules)
        ? pathItem.training_learning_path_modules[0]
        : pathItem?.training_learning_path_modules;
      if (pathItemError || !pathItem || pathItem.roleplay_scenario_id !== scenario.id || !moduleRelation || moduleRelation.status !== "published")
        throw new Error("PATH_ITEM_NOT_AVAILABLE");
      const { data: moduleProgress } = await this.db
        .from("user_training_path_module_progress")
        .select("status")
        .eq("user_id", userId)
        .eq("module_id", pathItem.module_id)
        .maybeSingle();
      if (!moduleProgress || !["available", "in_progress", "completed"].includes(moduleProgress.status))
        throw new Error("MODULE_LOCKED");
      pathContext = { pathId: moduleRelation.path_id, moduleId: pathItem.module_id, itemId: pathItem.id };
    }
    const now = new Date();
    const resumeExpiresAt = new Date(
      now.getTime() + serverEnv.TRAINING_ROLEPLAY_RESUME_WINDOW_HOURS * 3600000,
    ).toISOString();
    const snapshot = {
      scenarioId: scenario.id,
      slug: scenario.slug,
      title: scenario.public_title,
      category: scenario.category,
      characterName: scenario.character_name,
      learnerGoal: scenario.learner_goal,
      publicConfig: scenario.publicConfig,
    };
    const { data: session, error } = await this.db
      .from("training_roleplay_sessions")
      .insert({
        user_id: userId,
        scenario_id: scenario.id,
        custom_scenario: null,
        scenario_version_id: scenario.scenarioVersionId,
        scenario_snapshot: snapshot,
        plan_snapshot: access.plan,
        status: "ready",
        difficulty: input.difficulty,
        max_turns: Math.min(
          Number(scenario.max_turns),
          serverEnv.TRAINING_ROLEPLAY_MAX_TURNS_PER_SESSION,
        ),
        resume_expires_at: resumeExpiresAt,
        client_consumption_id: input.clientSessionId,
        provider_responded_at: now.toISOString(),
        scenario_state: { phase: "opening", disposition: 50 },
        learning_path_id: pathContext?.pathId ?? null,
        learning_path_module_id: pathContext?.moduleId ?? null,
        learning_path_item_id: pathContext?.itemId ?? null,
      })
      .select("id")
      .single();
    if (error || !session)
      throw new Error(
        error?.code === "23505"
          ? "SESSION_IDEMPOTENCY_CONFLICT"
          : "SESSION_CREATE_FAILED",
      );
    const opening = String(
      scenario.publicConfig.openingMessage ??
        "Gracias por venir. ¿Cómo quieres comenzar esta conversación?",
    );
    await this.db
      .from("training_roleplay_messages")
      .insert({
        session_id: session.id,
        user_id: userId,
        role: "character",
        content: opening,
        turn_number: 0,
        metadata: { opening: true },
      });
    await this.event(userId, "roleplay_session_created", {
      roleplay_session_id: session.id,
      scenario: scenario.slug,
      difficulty: input.difficulty,
      plan: access.plan,
      quota_consumed: false,
    });
    return {
      sessionId: session.id,
      openingMessage: opening,
      idempotent: false,
      access: { remaining: access.unlimited ? null : access.remaining },
      resumeExpiresAt,
    };
  }

  async getSession(userId: string, sessionId: string) {
    const [{ data: session }, { data: messages }] = await Promise.all([
      this.db
        .from("training_roleplay_sessions")
        .select(
          "id,status,scenario_snapshot,plan_snapshot,difficulty,turn_count,max_turns,started_at,last_activity_at,resume_expires_at,paused_at,finished_at,finish_reason,quota_consumed_at,evaluation_status,hints_used",
        )
        .eq("id", sessionId)
        .eq("user_id", userId)
        .maybeSingle(),
      this.db
        .from("training_roleplay_messages")
        .select("id,role,content,turn_number,created_at,metadata")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .neq("role", "system_summary")
        .order("created_at"),
    ]);
    if (!session) throw new Error("SESSION_NOT_FOUND");
    return { session, messages: messages ?? [] };
  }

  async turn(
    userId: string,
    sessionId: string,
    input: { clientMessageId: string; message: string },
  ): Promise<{
    userMessage?: MessageRow;
    message: {
      id: string;
      role?: string;
      content: string;
      turn_number?: number;
      created_at?: string;
    } | null;
    idempotent: boolean;
    turn?: number;
    limits?: { maxTurns: number; maxDurationMinutes: number };
  }> {
    const duplicate = await this.db
      .from("training_roleplay_messages")
      .select("turn_number")
      .eq("user_id", userId)
      .eq("client_turn_id", input.clientMessageId)
      .maybeSingle();
    if (duplicate.data) {
      const reply = await this.db
        .from("training_roleplay_messages")
        .select("id,content,created_at")
        .eq("session_id", sessionId)
        .eq("role", "character")
        .eq("turn_number", duplicate.data.turn_number)
        .maybeSingle();
      return { message: reply.data, idempotent: true };
    }
    const safety = inspectRoleplayMessage(input.message);
    if (!safety.allowed) {
      await this.db
        .from("training_roleplay_safety_events")
        .insert({
          session_id: sessionId,
          user_id: userId,
          event_type: safety.flags[0],
          severity: "medium",
          metadata: { flags: safety.flags },
        });
      throw new Error("UNSAFE_MESSAGE");
    }
    const { data: session } = await this.db
      .from("training_roleplay_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session || !["ready", "active"].includes(session.status))
      throw new Error("SESSION_NOT_ACTIVE");
    if (new Date(session.resume_expires_at).getTime() < Date.now()) {
      await this.db
        .from("training_roleplay_sessions")
        .update({
          status: "expired",
          finish_reason: "expired",
          finished_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
      throw new Error("SESSION_EXPIRED");
    }
    if (session.turn_count >= session.max_turns) throw new Error("TURN_LIMIT");
    const elapsedMinutes =
      (Date.now() - new Date(session.started_at).getTime()) / 60000;
    if (elapsedMinutes > serverEnv.TRAINING_ROLEPLAY_MAX_DURATION_MINUTES)
      throw new Error("SESSION_EXPIRED");
    const access = await this.access(userId);
    if (!session.quota_consumed_at && !access.canStart)
      throw new Error("MONTHLY_LIMIT_REACHED");
    const since = new Date(Date.now() - 60000).toISOString();
    const { count: recent } = await this.db
      .from("training_roleplay_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", since);
    if ((recent ?? 0) >= serverEnv.TRAINING_ROLEPLAY_RATE_LIMIT_PER_MINUTE)
      throw new Error("RATE_LIMITED");
    if (access.unlimited) {
      const today = new Date().toISOString().slice(0, 10);
      const { count: daily } = await this.db
        .from("training_roleplay_quota_consumptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("plan", "unlimited")
        .eq("status", "consumed")
        .gte("consumed_at", `${today}T00:00:00.000Z`);
      if (
        (daily ?? 0) >= serverEnv.TRAINING_ROLEPLAY_UNLIMITED_DAILY_SAFETY_LIMIT
      )
        throw new Error("DAILY_SAFETY_LIMIT");
    }
    const turn = Number(session.turn_count) + 1;
    const { data: userMessage, error: userError } = await this.db
      .from("training_roleplay_messages")
      .insert({
        session_id: sessionId,
        user_id: userId,
        client_turn_id: input.clientMessageId,
        role: "user",
        content: input.message,
        turn_number: turn,
        safety_flags: safety.flags,
      })
      .select("id,role,content,turn_number,created_at")
      .single();
    if (userError?.code === "23505") {
      const savedUser = await this.db
        .from("training_roleplay_messages")
        .select("turn_number")
        .eq("user_id", userId)
        .eq("client_turn_id", input.clientMessageId)
        .maybeSingle();
      const savedReply = await this.db
        .from("training_roleplay_messages")
        .select("id,role,content,turn_number,created_at")
        .eq("session_id", sessionId)
        .eq("role", "character")
        .eq("turn_number", savedUser.data?.turn_number ?? -1)
        .maybeSingle();
      return { message: savedReply.data, idempotent: true };
    }
    if (userError || !userMessage) throw new Error("MESSAGE_SAVE_FAILED");
    const [versionResult, historyResult] = await Promise.all([
      this.db
        .from("training_roleplay_scenario_versions")
        .select(
          "public_config,character_private_context,state_machine_config,safety_rules,prompt_version",
        )
        .eq("id", session.scenario_version_id)
        .single(),
      this.db
        .from("training_roleplay_messages")
        .select("id,role,content,turn_number,created_at")
        .eq("session_id", sessionId)
        .neq("role", "system_summary")
        .order("created_at")
        .limit(30),
    ]);
    const version = versionResult.data;
    if (!version) throw new Error("SCENARIO_VERSION_NOT_FOUND");
    try {
      const history = ((historyResult.data ?? []) as MessageRow[])
        .filter((item) => item.id !== userMessage.id)
        .map((item) => ({
          role:
            item.role === "user" ? ("user" as const) : ("assistant" as const),
          content: item.content,
        }));
      const generated = await this.provider.character({
        prompt: buildRoleplayCharacterPrompt({
          publicConfig: safeJson(version.public_config),
          privateContext: safeJson(version.character_private_context),
          state: safeJson(session.scenario_state),
          summary: String(session.conversation_summary ?? ""),
          difficulty: String(session.difficulty),
        }),
        history,
        message: input.message,
      });
      const { data: characterMessage, error: characterError } = await this.db
        .from("training_roleplay_messages")
        .insert({
          session_id: sessionId,
          user_id: userId,
          role: "character",
          content: generated.text,
          turn_number: turn,
          provider: generated.metrics.provider,
          model: generated.metrics.model,
          provider_message_id: generated.providerMessageId,
          input_tokens: generated.metrics.inputTokens,
          output_tokens: generated.metrics.outputTokens,
          estimated_cost_usd: generated.metrics.estimatedCostUsd,
          latency_ms: generated.metrics.latencyMs,
        })
        .select("id,role,content,turn_number,created_at")
        .single();
      if (characterError || !characterMessage)
        throw new Error("CHARACTER_MESSAGE_SAVE_FAILED");
      const now = new Date().toISOString();
      const conversationSummary =
        turn % 4 === 0
          ? buildConversationSummary(
              String(session.conversation_summary ?? ""),
              input.message,
              generated.text,
            )
          : String(session.conversation_summary ?? "");
      await Promise.all([
        this.db
          .from("training_roleplay_sessions")
          .update({
            status: "active",
            turn_count: turn,
            first_valid_user_turn_at: session.first_valid_user_turn_at ?? now,
            provider_responded_at: now,
            last_activity_at: now,
            updated_at: now,
            conversation_summary: conversationSummary,
            scenario_state: {
              ...safeJson(session.scenario_state),
              phase:
                turn >= session.max_turns - 2
                  ? "closing"
                  : turn > 3
                    ? "tension"
                    : "discovery",
            },
          })
          .eq("id", sessionId),
        this.db
          .from("training_roleplay_cost_events")
          .insert({
            session_id: sessionId,
            user_id: userId,
            operation: "character_message",
            provider: generated.metrics.provider,
            model: generated.metrics.model,
            input_tokens: generated.metrics.inputTokens,
            output_tokens: generated.metrics.outputTokens,
            estimated_cost_usd: generated.metrics.estimatedCostUsd,
            latency_ms: generated.metrics.latencyMs,
            plan: session.plan_snapshot,
            difficulty: session.difficulty,
          }),
      ]);
      if (!session.quota_consumed_at) {
        const { error } = await this.db.rpc("consume_training_roleplay_quota", {
          p_session_id: sessionId,
          p_user_id: userId,
          p_monthly_limit: serverEnv.TRAINING_ROLEPLAY_PRO_MONTHLY_LIMIT,
        });
        if (error)
          throw new Error(
            error.message.includes("monthly_limit")
              ? "MONTHLY_LIMIT_REACHED"
              : "QUOTA_CONSUME_FAILED",
          );
        await this.event(userId, "roleplay_quota_consumed", {
          roleplay_session_id: sessionId,
          plan: session.plan_snapshot,
          turn_count: turn,
        });
      }
      await this.event(
        userId,
        turn === 1
          ? "roleplay_first_user_message_sent"
          : "roleplay_message_sent",
        {
          roleplay_session_id: sessionId,
          plan: session.plan_snapshot,
          difficulty: session.difficulty,
          turn_count: turn,
          model: generated.metrics.model,
        },
      );
      return {
        userMessage,
        message: characterMessage,
        idempotent: false,
        turn,
        limits: {
          maxTurns: session.max_turns,
          maxDurationMinutes: serverEnv.TRAINING_ROLEPLAY_MAX_DURATION_MINUTES,
        },
      };
    } catch (error) {
      if (session.quota_consumed_at && Number(session.turn_count) < 2) {
        await this.db.rpc("reverse_training_roleplay_quota", {
          p_session_id: sessionId,
          p_user_id: userId,
          p_reason: "provider_failure_before_minimum_turns",
        });
      }
      await this.db
        .from("training_roleplay_sessions")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
      throw error;
    }
  }

  async hint(userId: string, sessionId: string) {
    const { data: session } = await this.db
      .from("training_roleplay_sessions")
      .select(
        "id,status,difficulty,hints_used,scenario_snapshot,scenario_state",
      )
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session || !["ready", "active", "paused"].includes(session.status)) {
      throw new Error("SESSION_NOT_ACTIVE");
    }
    const limits: Record<RoleplayDifficulty, number> = {
      fundamentals: 2,
      application: 1,
      advanced: 1,
      expert: 0,
    };
    const limit = limits[session.difficulty as RoleplayDifficulty];
    if (Number(session.hints_used) >= limit)
      throw new Error("HINT_LIMIT_REACHED");
    const snapshot = safeJson(session.scenario_snapshot);
    const state = safeJson(session.scenario_state);
    const hints = [
      `Vuelve al objetivo: ${String(snapshot.learnerGoal ?? "busca un próximo paso concreto")}. Formula una pregunta antes de defender tu posición.`,
      `La conversación está en fase ${String(state.phase ?? "inicial")}. Resume lo que entendiste y propone un acuerdo verificable.`,
    ];
    const nextCount = Number(session.hints_used) + 1;
    await this.db
      .from("training_roleplay_sessions")
      .update({ hints_used: nextCount, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", userId);
    await this.event(userId, "roleplay_hint_used", {
      roleplay_session_id: sessionId,
      difficulty: session.difficulty,
      hint_count: nextCount,
    });
    return {
      hint: hints[Math.min(nextCount - 1, hints.length - 1)],
      used: nextCount,
      limit,
    };
  }

  async pause(userId: string, sessionId: string) {
    const { data, error } = await this.db
      .from("training_roleplay_sessions")
      .update({
        status: "paused",
        paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .in("status", ["ready", "active"])
      .select("id,resume_expires_at")
      .maybeSingle();
    if (error || !data) throw new Error("SESSION_NOT_PAUSABLE");
    await this.event(userId, "roleplay_paused", {
      roleplay_session_id: sessionId,
    });
    return data;
  }

  async resume(userId: string, sessionId: string) {
    const { data: session } = await this.db
      .from("training_roleplay_sessions")
      .select("id,status,resume_expires_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session || session.status !== "paused")
      throw new Error("SESSION_NOT_RESUMABLE");
    if (new Date(session.resume_expires_at).getTime() < Date.now()) {
      await this.db
        .from("training_roleplay_sessions")
        .update({
          status: "expired",
          finish_reason: "expired",
          finished_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
      throw new Error("SESSION_EXPIRED");
    }
    await this.db
      .from("training_roleplay_sessions")
      .update({
        status: "active",
        paused_at: null,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    await this.event(userId, "roleplay_resumed", {
      roleplay_session_id: sessionId,
    });
    return this.getSession(userId, sessionId);
  }

  async finish(userId: string, sessionId: string, reason: string) {
    const { data: session } = await this.db
      .from("training_roleplay_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session || !["ready", "active", "paused"].includes(session.status))
      throw new Error("SESSION_NOT_FINISHABLE");
    const now = new Date().toISOString();
    await this.db
      .from("training_roleplay_sessions")
      .update({
        status: "evaluating",
        finish_reason: reason,
        finished_at: now,
        evaluation_status: "processing",
        updated_at: now,
      })
      .eq("id", sessionId);
    await this.event(userId, "roleplay_finished", {
      roleplay_session_id: sessionId,
      plan: session.plan_snapshot,
      difficulty: session.difficulty,
      turn_count: session.turn_count,
      result: reason,
    });
    const [{ data: version }, { data: transcript }] = await Promise.all([
      this.db
        .from("training_roleplay_scenario_versions")
        .select("public_config,rubric_version_id")
        .eq("id", session.scenario_version_id)
        .single(),
      this.db
        .from("training_roleplay_messages")
        .select("id,role,content")
        .eq("session_id", sessionId)
        .neq("role", "system_summary")
        .order("created_at"),
    ]);
    if (!version || !transcript) throw new Error("EVALUATION_CONTEXT_MISSING");
    const { data: rubric } = await this.db
      .from("training_roleplay_rubric_versions")
      .select("id,criteria,total_points")
      .eq("id", version.rubric_version_id)
      .single();
    if (!rubric) throw new Error("RUBRIC_NOT_FOUND");
    const criteria = Array.isArray(rubric.criteria)
      ? (rubric.criteria as Array<JsonObject>)
      : [];
    const { data: evaluation } = await this.db
      .from("training_roleplay_evaluations")
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          rubric_version_id: rubric.id,
          status: "processing",
        },
        { onConflict: "session_id" },
      )
      .select("id")
      .single();
    try {
      const generated = await this.provider.evaluate({
        prompt: buildRoleplayEvaluationPrompt({
          rubric: rubric.criteria,
          scenario: version.public_config,
          transcript,
          hintsUsed: Number(session.hints_used),
        }),
        transcript,
        criterionIds: criteria.map((item) => String(item.id)),
      });
      await Promise.all([
        this.db
          .from("training_roleplay_evaluations")
          .update({
            status: "completed",
            overall_score: generated.result.overallScore,
            confidence: generated.result.confidence,
            outcome: generated.result.outcome,
            result: generated.result,
            provider: generated.metrics.provider,
            model: generated.metrics.model,
            input_tokens: generated.metrics.inputTokens,
            output_tokens: generated.metrics.outputTokens,
            estimated_cost_usd: generated.metrics.estimatedCostUsd,
            latency_ms: generated.metrics.latencyMs,
            completed_at: new Date().toISOString(),
          })
          .eq("id", evaluation?.id),
        this.db
          .from("training_roleplay_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            evaluation_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId),
        this.db
          .from("training_roleplay_cost_events")
          .insert({
            session_id: sessionId,
            user_id: userId,
            operation: "final_evaluation",
            provider: generated.metrics.provider,
            model: generated.metrics.model,
            input_tokens: generated.metrics.inputTokens,
            output_tokens: generated.metrics.outputTokens,
            estimated_cost_usd: generated.metrics.estimatedCostUsd,
            latency_ms: generated.metrics.latencyMs,
            plan: session.plan_snapshot,
            difficulty: session.difficulty,
          }),
      ]);
      await this.applySkillMastery(
        userId,
        session.scenario_id,
        generated.result.overallScore,
      );
      await this.event(userId, "roleplay_evaluation_completed", {
        roleplay_session_id: sessionId,
        plan: session.plan_snapshot,
        difficulty: session.difficulty,
        turn_count: session.turn_count,
        result: generated.result.outcome,
        score_bucket: Math.floor(generated.result.overallScore / 20) * 20,
        model: generated.metrics.model,
        hint_count: session.hints_used,
      });
      return { status: "completed", evaluationId: evaluation?.id };
    } catch (error) {
      await Promise.all([
        this.db
          .from("training_roleplay_evaluations")
          .update({
            status: "failed",
            error_code:
              error instanceof Error ? error.message : "EVALUATION_FAILED",
          })
          .eq("id", evaluation?.id),
        this.db
          .from("training_roleplay_sessions")
          .update({
            status: "completed",
            evaluation_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId),
      ]);
      await this.event(userId, "roleplay_evaluation_failed", {
        roleplay_session_id: sessionId,
        plan: session.plan_snapshot,
        difficulty: session.difficulty,
      });
      return { status: "pending", evaluationId: evaluation?.id };
    }
  }

  async evaluation(userId: string, sessionId: string) {
    const { data } = await this.db
      .from("training_roleplay_evaluations")
      .select("id,status,overall_score,confidence,outcome,result,completed_at")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) throw new Error("EVALUATION_NOT_FOUND");
    return data;
  }

  async history(userId: string) {
    const { data } = await this.db
      .from("training_roleplay_sessions")
      .select(
        "id,status,scenario_snapshot,difficulty,turn_count,started_at,last_activity_at,finished_at,finish_reason,evaluation_status,training_roleplay_evaluations(overall_score,outcome)",
      )
      .eq("user_id", userId)
      .eq("is_editorial_preview", false)
      .order("last_activity_at", { ascending: false })
      .limit(100);
    return { items: data ?? [] };
  }
}
