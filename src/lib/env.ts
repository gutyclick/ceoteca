import { z } from "zod";

const booleanStringSchema = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEMO_MODE: booleanStringSchema,
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_TRAINING_DATA_SOURCE: z
    .enum(["mock", "supabase"])
    .default("mock"),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().optional(),
  OPENAI_TTS_MODEL: z.string().optional(),
  OPENAI_TTS_VOICE: z.string().optional(),
  TRAINING_AI_ENABLED: booleanStringSchema,
  TRAINING_AI_OPEN_RESPONSE_ENABLED: booleanStringSchema,
  TRAINING_AI_REVISIONS_ENABLED: booleanStringSchema,
  TRAINING_AI_FALLBACK_ENABLED: booleanStringSchema,
  TRAINING_AI_DEFAULT_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_AI_FALLBACK_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_AI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(15000),
  TRAINING_AI_MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(1),
  TRAINING_AI_MAX_INPUT_CHARS: z.coerce
    .number()
    .int()
    .min(100)
    .max(10000)
    .default(2500),
  TRAINING_AI_DAILY_LIMIT_FREE: z.coerce.number().int().min(0).default(2),
  TRAINING_AI_DAILY_LIMIT_PRO: z.coerce.number().int().min(0).default(30),
  TRAINING_AI_FREE_DEEP_EVALUATIONS_PER_MONTH: z.coerce
    .number()
    .int()
    .min(0)
    .default(1),
  TRAINING_AI_FREE_REVISIONS_PER_EVALUATION: z.coerce
    .number()
    .int()
    .min(0)
    .default(0),
  TRAINING_AI_MONTHLY_BUDGET_LIMIT: z.coerce.number().min(0).default(100),
  TRAINING_EDITORIAL_AI_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_EXERCISE_GENERATION_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_DISTRACTORS_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_FEEDBACK_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_VARIATIONS_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_RUBRICS_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_REVIEW_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_TEMPLATE_SUGGESTION_ENABLED: booleanStringSchema,
  TRAINING_EDITORIAL_AI_MONTHLY_BUDGET_USD: z.coerce
    .number()
    .min(0)
    .default(25),
  TRAINING_EDITORIAL_AI_DAILY_JOB_LIMIT: z.coerce
    .number()
    .int()
    .min(1)
    .default(30),
  TRAINING_EDITORIAL_AI_MAX_EXERCISES_PER_JOB: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .default(5),
  TRAINING_EDITORIAL_AI_MAX_REGENERATIONS_PER_RESULT: z.coerce
    .number()
    .int()
    .min(0)
    .max(5)
    .default(2),
  TRAINING_EDITORIAL_AI_DEFAULT_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_EDITORIAL_AI_FALLBACK_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_EDITORIAL_AI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(20000),
  TRAINING_EDITORIAL_AI_MAX_RETRIES: z.coerce
    .number()
    .int()
    .min(0)
    .max(2)
    .default(1),
  TRAINING_EDITORIAL_AI_MAX_CONTEXT_CHARS: z.coerce
    .number()
    .int()
    .min(500)
    .max(20000)
    .default(8000),
  TRAINING_LEARNING_ANALYTICS_ENABLED: booleanStringSchema,
  TRAINING_CONTENT_QUALITY_ENABLED: booleanStringSchema,
  TRAINING_QUALITY_ALERTS_ENABLED: booleanStringSchema,
  TRAINING_EXPERIMENTS_ENABLED: booleanStringSchema,
  TRAINING_RETENTION_ANALYTICS_ENABLED: booleanStringSchema,
  TRAINING_TRANSFER_ANALYTICS_ENABLED: booleanStringSchema,
  TRAINING_ANALYTICS_MIN_ATTEMPTS: z.coerce.number().int().min(5).default(20),
  TRAINING_ANALYTICS_MIN_USERS: z.coerce.number().int().min(5).default(10),
  TRAINING_ANALYTICS_MIN_COHORT_SIZE: z.coerce.number().int().min(5).default(10),
  TRAINING_ANALYTICS_RETENTION_DAYS: z.coerce.number().int().min(30).max(1095).default(395),
  TRAINING_EXPERIMENT_SALT: z.string().min(32).optional(),
  TRAINING_ROLEPLAY_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_CATALOG_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_PRO_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_UNLIMITED_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_ADVANCED_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_EXPERT_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_EDITORIAL_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_FREE_MONTHLY_LIMIT: z.coerce.number().int().min(0).max(0).default(0),
  TRAINING_ROLEPLAY_PRO_MONTHLY_LIMIT: z.coerce.number().int().min(0).max(100).default(2),
  TRAINING_ROLEPLAY_UNLIMITED_DAILY_SAFETY_LIMIT: z.coerce.number().int().min(1).max(500).default(10),
  TRAINING_ROLEPLAY_MAX_TURNS_PER_SESSION: z.coerce.number().int().min(2).max(100).default(24),
  TRAINING_ROLEPLAY_MAX_DURATION_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  TRAINING_ROLEPLAY_MAX_CONCURRENT_SESSIONS: z.coerce.number().int().min(1).max(5).default(1),
  TRAINING_ROLEPLAY_RESUME_WINDOW_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  TRAINING_ROLEPLAY_MESSAGE_MAX_CHARS: z.coerce.number().int().min(100).max(4000).default(1500),
  TRAINING_ROLEPLAY_CHARACTER_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(100).max(2000).default(300),
  TRAINING_ROLEPLAY_EVALUATION_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(300).max(4000).default(1200),
  TRAINING_ROLEPLAY_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(60).default(8),
  TRAINING_ROLEPLAY_CUSTOM_SCENARIOS_ENABLED: booleanStringSchema,
  TRAINING_ROLEPLAY_CHARACTER_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_ROLEPLAY_EVALUATION_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_ROLEPLAY_SUMMARY_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_ROLEPLAY_FALLBACK_MODEL: z.string().default("gpt-5.4-mini"),
  TRAINING_ROLEPLAY_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(20000),
  TRAINING_ROLEPLAY_MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(1),
  TRAINING_ROLEPLAY_MONTHLY_BUDGET_USD: z.coerce.number().min(0).default(100),
  TRAINING_ROLEPLAY_DAILY_BUDGET_USD: z.coerce.number().min(0).default(10),
  CRON_SECRET: z.string().optional(),
  PAYMENTS_PROVIDER: z.enum(["disabled"]).default("disabled"),
  PAYMENTS_SECRET_KEY: z.string().optional(),
  PAYMENTS_WEBHOOK_SECRET: z.string().optional(),
  RATE_LIMIT_PROVIDER: z.enum(["memory"]).default("memory"),
  RATE_LIMIT_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["disabled", "supabase"]).default("disabled"),
  STORAGE_BUCKET: z.string().default("audio-assets"),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_TRAINING_DATA_SOURCE:
    process.env.NEXT_PUBLIC_TRAINING_DATA_SOURCE,
});

export const serverEnv = serverEnvSchema.parse({
  ...process.env,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!clientEnv.NEXT_PUBLIC_DEMO_MODE) {
  const missingSupabaseVars = [
    ["NEXT_PUBLIC_SUPABASE_URL", clientEnv.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ].filter(([, value]) => !value);

  if (missingSupabaseVars.length > 0) {
    throw new Error(
      `Faltan variables de Supabase para modo real: ${missingSupabaseVars
        .map(([key]) => key)
        .join(", ")}`,
    );
  }
}

export function assertSupabaseServiceRole() {
  if (
    !clientEnv.NEXT_PUBLIC_DEMO_MODE &&
    !serverEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY para operaciones administrativas de Supabase.",
    );
  }
}
