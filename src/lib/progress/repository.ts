import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProgressInput = {
  userId: string;
  bookId: string;
  progress: number;
  completed?: boolean;
};

export interface ProgressRepository {
  markProgress(input: ProgressInput): Promise<void>;
}

export class MockProgressRepository implements ProgressRepository {
  async markProgress(): Promise<void> {
    return Promise.resolve();
  }
}

export class SupabaseProgressRepository implements ProgressRepository {
  async markProgress(input: ProgressInput): Promise<void> {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("user_book_progress").upsert(
      {
        user_id: input.userId,
        book_id: input.bookId,
        progress: input.progress,
        completed: input.completed ?? input.progress >= 100,
        completed_at:
          input.completed || input.progress >= 100 ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,book_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export function createProgressRepository(): ProgressRepository {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockProgressRepository();
  }

  return new SupabaseProgressRepository();
}
