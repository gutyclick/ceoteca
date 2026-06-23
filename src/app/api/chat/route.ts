import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { plans } from "@/config/plans";
import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { createBookRepository } from "@/lib/books/repository";
import { createChatRepository } from "@/lib/chat/repository";
import { clientEnv } from "@/lib/env";
import { createAIProvider } from "@/lib/openai/provider";
import { canAccessFeature } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { chatRequestSchema } from "@/lib/validation/chat";
import type { AppUser } from "@/types";

function getFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

async function getAuthenticatedUser(
  request: NextRequest,
): Promise<{ accessToken?: string; user: AppUser } | null> {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return { user: demoUser };
  }

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data: authData, error: authError } =
    await supabase.auth.getUser(accessToken);

  if (authError || !authData.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, plan")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    accessToken,
    user: {
      id: authData.user.id,
      email: authData.user.email ?? "",
      fullName: profile.full_name ?? "Usuario",
      plan: profile.plan,
      isDemo: false,
    },
  };
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedUser(request);

  if (!session) {
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para usar el chat.",
      },
      401,
    );
  }

  const rateLimit = checkRateLimit(`chat:${session.user.id}`, 20, 60_000);

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
    const fieldErrors = getFieldErrors(parsed.error);
    const firstFieldError = Object.values(fieldErrors).flat()[0];

    return jsonError(
      {
        code: "INVALID_INPUT",
        message: firstFieldError ?? "Revisa los campos enviados.",
        fieldErrors,
      },
      400,
    );
  }

  const bookRepository = createBookRepository();
  const books =
    parsed.data.context === "site"
      ? (await bookRepository.list()).filter((item) => item.isPublished)
      : [];
  const book =
    parsed.data.context === "site"
      ? books[0]
      : await bookRepository.getBySlug(parsed.data.bookId ?? "");

  if (!book || !book.isPublished) {
    return jsonError(
      {
        code: "BOOK_NOT_FOUND",
        message:
          parsed.data.context === "site"
            ? "No hay análisis publicados para responder en este momento."
            : "No encontramos este libro.",
      },
      404,
    );
  }

  if (!canAccessFeature(session.user.plan, "chat")) {
    return jsonError(
      {
        code: "CHAT_NOT_INCLUDED",
        message: "Tu plan actual no incluye chat con IA.",
      },
      403,
    );
  }

  const plan = plans[session.user.plan];
  const chatRepository = createChatRepository(session.accessToken);
  const questionCount = await chatRepository.getUsage(
    session.user.id,
    book.id,
    parsed.data.context,
  );

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
    const result =
      parsed.data.context === "site"
        ? await provider.answerSiteQuestion({
            books,
            message: parsed.data.message,
            conversation: parsed.data.conversation,
          })
        : await provider.answerBookQuestion({
            book,
            message: parsed.data.message,
            conversation: parsed.data.conversation,
          });

    const nextCount = await chatRepository.incrementUsage(
      session.user.id,
      book.id,
      parsed.data.context,
    );
    await chatRepository.persistMessages({
      userId: session.user.id,
      bookId: book.id,
      context: parsed.data.context,
      userMessage: parsed.data.message,
      assistantMessage: result.message,
    });

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
  } catch (caughtError) {
    console.error("Chat request failed", caughtError);

    return jsonError(
      {
        code: "CHAT_RESPONSE_FAILED",
        message: "No pudimos generar una respuesta en este momento.",
      },
      502,
    );
  }
}
