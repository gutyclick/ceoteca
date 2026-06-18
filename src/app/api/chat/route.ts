import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { plans } from "@/config/plans";
import { getBookBySlug } from "@/data/books";
import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { createAIProvider } from "@/lib/openai/provider";
import { canAccessFeature } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { chatRequestSchema } from "@/lib/validation/chat";

const demoMonthlyUsage = new Map<string, number>();

function getFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`chat:${demoUser.id}`, 20, 60_000);

  if (!rateLimit.allowed) {
    return jsonError(
      {
        code: "RATE_LIMITED",
        message: "Demasiadas preguntas seguidas. Inténtalo de nuevo en un momento.",
      },
      429,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." },
      400,
    );
  }

  const parsed = chatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa los campos enviados.",
        fieldErrors: getFieldErrors(parsed.error),
      },
      400,
    );
  }

  const book = getBookBySlug(parsed.data.bookId);

  if (!book || !book.isPublished) {
    return jsonError(
      { code: "BOOK_NOT_FOUND", message: "No encontramos este libro." },
      404,
    );
  }

  if (!canAccessFeature(demoUser.plan, "chat")) {
    return jsonError(
      {
        code: "CHAT_NOT_INCLUDED",
        message: "Tu plan actual no incluye chat con IA.",
      },
      403,
    );
  }

  const plan = plans[demoUser.plan];
  const usageKey = `${demoUser.id}:${new Date().toISOString().slice(0, 7)}`;
  const questionCount = demoMonthlyUsage.get(usageKey) ?? 0;

  if (plan.chatMonthlyLimit !== null && questionCount >= plan.chatMonthlyLimit) {
    return jsonError(
      {
        code: "MONTHLY_LIMIT_REACHED",
        message: "Alcanzaste el límite mensual de preguntas.",
      },
      403,
    );
  }

  try {
    const provider = createAIProvider();
    const result = await provider.answerBookQuestion({
      book,
      message: parsed.data.message,
      conversation: parsed.data.conversation,
    });

    const nextCount = questionCount + 1;
    demoMonthlyUsage.set(usageKey, nextCount);

    return jsonData({
      message: result.message,
      remainingQuestions:
        plan.chatMonthlyLimit === null
          ? null
          : Math.max(plan.chatMonthlyLimit - nextCount, 0),
      usage: {
        questionCount: nextCount,
        limit: plan.chatMonthlyLimit,
      },
    });
  } catch {
    return jsonError(
      {
        code: "AI_PROVIDER_ERROR",
        message: "No pudimos generar una respuesta en este momento.",
      },
      502,
    );
  }
}
