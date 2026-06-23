import { clientEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { ChatConversationMessage } from "@/lib/validation/chat";

export type ChatContext = "book" | "site";

export type PersistChatInput = {
  userId: string;
  bookId: string;
  context: ChatContext;
  userMessage: string;
  assistantMessage: string;
};

export interface ChatRepository {
  getUsage(userId: string, bookId: string, context: ChatContext): Promise<number>;
  incrementUsage(userId: string, bookId: string, context: ChatContext): Promise<number>;
  persistMessages(input: PersistChatInput): Promise<void>;
  listMessages(
    userId: string,
    bookId: string,
    context: ChatContext,
  ): Promise<ChatConversationMessage[]>;
}

const mockUsage = new Map<string, number>();
const mockMessages = new Map<string, ChatConversationMessage[]>();

export class MockChatRepository implements ChatRepository {
  async getUsage(userId: string, bookId: string, context: ChatContext): Promise<number> {
    const key = `${userId}:${context}:${bookId}:${new Date().toISOString().slice(0, 7)}`;
    return mockUsage.get(key) ?? 0;
  }

  async incrementUsage(userId: string, bookId: string, context: ChatContext): Promise<number> {
    const key = `${userId}:${context}:${bookId}:${new Date().toISOString().slice(0, 7)}`;
    const next = (mockUsage.get(key) ?? 0) + 1;
    mockUsage.set(key, next);
    return next;
  }

  async persistMessages(input: PersistChatInput): Promise<void> {
    const key = `${input.userId}:${input.context}:${input.bookId}`;
    const current = mockMessages.get(key) ?? [];
    mockMessages.set(key, [
      ...current,
      { role: "user", content: input.userMessage },
      { role: "assistant", content: input.assistantMessage },
    ]);
  }

  async listMessages(
    userId: string,
    bookId: string,
    context: ChatContext,
  ): Promise<ChatConversationMessage[]> {
    return mockMessages.get(`${userId}:${context}:${bookId}`) ?? [];
  }
}

export class SupabaseChatRepository implements ChatRepository {
  private getClient() {
    return createServiceSupabaseClient();
  }

  async getUsage(userId: string, bookId: string, context: ChatContext): Promise<number> {
    const supabase = this.getClient();
    const month = `${new Date().toISOString().slice(0, 7)}-01`;
    const { data, error } = await supabase
      .from("chat_usage")
      .select("question_count")
      .eq("user_id", userId)
      .eq("context", context)
      .eq("book_id", bookId)
      .eq("month", month)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.question_count ?? 0;
  }

  async incrementUsage(userId: string, bookId: string, context: ChatContext): Promise<number> {
    const supabase = this.getClient();
    const month = `${new Date().toISOString().slice(0, 7)}-01`;
    const currentCount = await this.getUsage(userId, bookId, context);
    const nextCount = currentCount + 1;
    const { error } = await supabase.from("chat_usage").upsert(
      {
        user_id: userId,
        book_id: bookId,
        context,
        month,
        question_count: nextCount,
      },
      { onConflict: "user_id,context,book_id,month" },
    );

    if (error) {
      throw new Error(error.message);
    }

    return nextCount;
  }

  async persistMessages(input: PersistChatInput): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from("chat_messages").insert([
      {
        user_id: input.userId,
        book_id: input.bookId,
        context: input.context,
        role: "user",
        content: input.userMessage,
      },
      {
        user_id: input.userId,
        book_id: input.bookId,
        context: input.context,
        role: "assistant",
        content: input.assistantMessage,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }
  }

  async listMessages(
    userId: string,
    bookId: string,
    context: ChatContext,
  ): Promise<ChatConversationMessage[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("context", context)
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

  void accessToken;

  return new SupabaseChatRepository();
}
