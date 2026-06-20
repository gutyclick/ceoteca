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
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().optional(),
  OPENAI_TTS_MODEL: z.string().optional(),
  OPENAI_TTS_VOICE: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  PAYMENTS_PROVIDER: z.enum(["disabled"]).default("disabled"),
  PAYMENTS_SECRET_KEY: z.string().optional(),
  PAYMENTS_WEBHOOK_SECRET: z.string().optional(),
  RATE_LIMIT_PROVIDER: z.enum(["memory"]).default("memory"),
  RATE_LIMIT_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["disabled"]).default("disabled"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
