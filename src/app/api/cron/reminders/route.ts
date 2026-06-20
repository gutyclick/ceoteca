import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { serverEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

function isAuthorized(request: NextRequest) {
  if (!serverEnv.CRON_SECRET) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${serverEnv.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Cron no autorizado." },
      401,
    );
  }

  const supabase = createServiceSupabaseClient();
  const inactiveBefore = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const recentNotificationAfter = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const { data: progressRows, error: progressError } = await supabase
    .from("user_book_progress")
    .select("user_id,book_id,progress,updated_at")
    .lt("progress", 100)
    .lt("updated_at", inactiveBefore.toISOString())
    .order("updated_at", { ascending: true })
    .limit(100);

  if (progressError) {
    return jsonError(
      { code: "PROGRESS_ERROR", message: "No pudimos revisar el progreso." },
      500,
    );
  }

  const bookIds = [...new Set((progressRows ?? []).map((row) => row.book_id))];
  const { data: booksData } =
    bookIds.length > 0
      ? await supabase.from("books").select("id,title,slug").in("id", bookIds)
      : { data: [] };
  const bookMap = new Map((booksData ?? []).map((book) => [book.id, book]));
  const notifications = [];

  for (const row of progressRows ?? []) {
    const book = bookMap.get(row.book_id);

    if (!book) {
      continue;
    }

    const href = `/libro/${book.slug}`;
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("type", "reading_reminder")
      .eq("href", href)
      .gte("created_at", recentNotificationAfter.toISOString())
      .limit(1);

    if ((existing ?? []).length > 0) {
      continue;
    }

    notifications.push({
      user_id: row.user_id,
      type: "reading_reminder" as const,
      title: "Retoma tu lectura",
      body: `Tienes ${book.title} en progreso. Puedes continuar desde donde lo dejaste.`,
      href,
      metadata: {
        bookId: row.book_id,
        progress: row.progress,
      },
    });
  }

  if (notifications.length === 0) {
    return jsonData({ created: 0 });
  }

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    return jsonError(
      { code: "NOTIFICATION_INSERT_ERROR", message: "No pudimos crear recordatorios." },
      500,
    );
  }

  return jsonData({ created: notifications.length });
}
