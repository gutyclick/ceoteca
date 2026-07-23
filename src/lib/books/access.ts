import type { PlanKey } from "@/config/plans";
import { clientEnv } from "@/lib/env";
import { canAccessFeature } from "@/lib/permissions";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

type BookChatAccessInput = {
  userId: string;
  plan: PlanKey;
  bookId: string;
};

export async function canAccessBookChat(input: BookChatAccessInput): Promise<boolean> {
  if (canAccessFeature(input.plan, "allBooks")) return true;
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return false;

  const { data, error } = await createServiceSupabaseClient()
    .from("user_book_progress")
    .select("book_id")
    .eq("user_id", input.userId)
    .eq("book_id", input.bookId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
