import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ChatConversationMessage } from "@/lib/validation/chat";

export type PersistChatInput = {
  userId: string;
  bookId: string;
  userMessage: string;
  assistantMessage: string;
};

export interface ChatRepository {
  getUsage(userId: string, bookId: string): Promise<number>;
  incrementUsage(userId: string, bookId: string): Promise<number>;
  persistMessages(input: PersistChatInput): Promise<void>;
  listMessages(userId: string, bookId: string): Promise<ChatConversationMessage[]>;
}

const mockUsage = new Map<string, number>();
const mockMessages = new Map<string, ChatConversationMessage[]>();

export class MockChatRepository implements ChatRepository {
  async getUsage(userId: string, bookId: string): Promise<number> {
    const key = `${userId}:${bookId}:${new Date().toISOString().slice(0, 7)}`;
    return mockUsage.get(key) ?? 0;
  }

  async incrementUsage(userId: string, bookId: string): Promise<number> {
    const key = `${userId}:${bookId}:${new Date().toISOString().slice(0, 7)}`;
    const next = (mockUsage.get(key) ?? 0) + 1;
    mockUsage.set(key, next);
    return next;
  }

  async persistMessages(input: PersistChatInput): Promise<void> {
    const key = `${input.userId}:${input.bookId}`;
    const current = mockMessages.get(key) ?? [];
    mockMessages.set(key, [
      ...current,
      { role: "user", content: input.userMessage },
      { role: "assistant", content: input.assistantMessage },
    ]);
  }

  async listMessages(userId: string, bookId: string): Promise<ChatConversationMessage[]> {
    return mockMessages.get(`${userId}:${bookId}`) ?? [];
  }
}

export class SupabaseChatRepository implements ChatRepository {
  constructor(private readonly accessToken?: string) {}

  async getUsage(userId: string, bookId: string): Promise<number> {
    const supabase = createServerSupabaseClient(this.accessToken);
    const month = `${new Date().toISOString().slice(0, 7)}-01`;
    const { data, error } = await supabase
      .from("chat_usage")
      .select("question_count")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("month", month)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.question_count ?? 0;
  }

  async incrementUsage(userId: string, bookId: string): Promise<number> {
    const supabase = createServerSupabaseClient(this.accessToken);
    const month = `${new Date().toISOString().slice(0, 7)}-01`;
    const { data, error } = await supabase.rpc("increment_chat_usage", {
      target_user_id: userId,
      target_book_id: bookId,
      target_month: month,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async persistMessages(input: PersistChatInput): Promise<void> {
    const supabase = createServerSupabaseClient(this.accessToken);
    const { error } = await supabase.from("chat_messages").insert([
      {
        user_id: input.userId,
        book_id: input.bookId,
        role: "user",
        content: input.userMessage,
      },
      {
        user_id: input.userId,
        book_id: input.bookId,
        role: "assistant",
        content: input.assistantMessage,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listMessages(userId: string, bookId: string): Promise<ChatConversationMessage[]> {
    const supabase = createServerSupabaseClient(this.accessToken);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}

export function createChatRepository(accessToken?: string): ChatRepository {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockChatRepository();
  }

  return new SupabaseChatRepository(accessToken);
}
