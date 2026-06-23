import { NextRequest } from "next/server";

import { plans } from "@/config/plans";
import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { createBookRepository } from "@/lib/books/repository";
import { createChatRepository } from "@/lib/chat/repository";
import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types";

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

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedUser(request);

  if (!session) {
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para ver tu historial de chat.",
      },
      401,
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const context = searchParams.get("context") === "site" ? "site" : "book";
  const bookSlug = searchParams.get("bookId");
  const bookRepository = createBookRepository();
  const books =
    context === "site"
      ? (await bookRepository.list()).filter((item) => item.isPublished)
      : [];
  const book =
    context === "site"
      ? books[0]
      : bookSlug
        ? await bookRepository.getBySlug(bookSlug)
        : null;

  if (!book || !book.isPublished) {
    return jsonError(
      {
        code: "BOOK_NOT_FOUND",
        message:
          context === "site"
            ? "No hay análisis publicados para cargar el historial."
            : "No encontramos este libro.",
      },
      404,
    );
  }

  const plan = plans[session.user.plan];
  const chatRepository = createChatRepository(session.accessToken);
  const [messages, questionCount] = await Promise.all([
    chatRepository.listMessages(session.user.id, book.id, context),
    chatRepository.getUsage(session.user.id, book.id, context),
  ]);

  return jsonData({
    messages: messages.slice(-40),
    remainingQuestions:
      plan.chatMonthlyLimit === null
        ? null
        : Math.max(plan.chatMonthlyLimit - questionCount, 0),
    usage: {
      questionCount,
      limit: plan.chatMonthlyLimit,
    },
  });
}
