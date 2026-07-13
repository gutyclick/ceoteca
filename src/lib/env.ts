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
  TRAINING_AI_MONTHLY_BUDGET_LIMIT: z.coerce.number().min(0).default(100),
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
