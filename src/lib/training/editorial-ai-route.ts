import { NextRequest } from "next/server";
import type { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { EditorialGenerationService } from "@/lib/training/editorial-ai-service";
import type { EditorialJobType } from "@/lib/training/editorial-ai-schemas";

const errorMap: Record<string, { status: number; message: string }> = {
  EDITORIAL_AI_DISABLED: {
    status: 503,
    message:
      "La asistencia editorial con IA no está disponible en este entorno.",
  },
  EDITORIAL_DAILY_LIMIT: {
    status: 429,
    message: "Alcanzaste el límite diario de trabajos editoriales.",
  },
  EDITORIAL_BUDGET_EXCEEDED: {
    status: 429,
    message: "El presupuesto editorial mensual está agotado.",
  },
  EDITORIAL_CONTEXT_TOO_LONG: {
    status: 413,
    message: "El contexto supera el límite editorial permitido.",
  },
  EDITORIAL_TIMEOUT: {
    status: 504,
    message: "La generación tardó demasiado. Puedes volver a intentarlo.",
  },
  INVALID_PROVIDER_OUTPUT: {
    status: 502,
    message: "La salida no cumplió el formato editorial requerido.",
  },
};

export async function handleEditorialGeneration<
  T extends Record<string, unknown>,
>(
  request: NextRequest,
  options: {
    jobType: EditorialJobType;
    schema: z.ZodType<T>;
    action?: "ai_generate" | "ai_review";
    count: (input: T) => number;
    sourceType?: (
      input: T,
    ) => "concept" | "exercise" | "analysis" | "manual" | undefined;
    sourceId?: (input: T) => string | undefined;
  },
) {
  const access = await requireEditorialAccess(
    request,
    options.action ?? "ai_generate",
  );
  if (!access)
    return jsonError(
      {
        code: "FORBIDDEN",
        message: "Tu rol no permite usar esta función editorial.",
      },
      403,
    );
  const parsed = options.schema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_INPUT",
        message:
          parsed.error.issues[0]?.message ?? "Revisa los campos enviados.",
        fieldErrors: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).filter(
            (entry): entry is [string, string[]] => Array.isArray(entry[1]),
          ),
        ),
      },
      400,
    );
  try {
    const result = await new EditorialGenerationService(access.service).execute(
      {
        userId: access.userId,
        jobType: options.jobType,
        clientJobId: String(parsed.data.clientJobId),
        sourceType: options.sourceType?.(parsed.data) ?? "manual",
        sourceId: options.sourceId?.(parsed.data),
        requestedCount: options.count(parsed.data),
        payload: parsed.data,
      },
    );
    return jsonData(result, 201);
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "EDITORIAL_GENERATION_FAILED";
    const mapped = errorMap[code] ?? {
      status: 500,
      message: "No pudimos completar la generación editorial.",
    };
    return jsonError({ code, message: mapped.message }, mapped.status);
  }
}
