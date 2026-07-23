import { clientEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { ChatConversationMessage } from "@/lib/validation/chat";

export type ChatContext = "book" | "site";

export type PersistChatInput = {
  userId: string;
  bookId: string;
  context: ChatContext;
  conversationId?: string | null;
  userMessage: string;
  assistantMessage: string;
};

export type ChatEventType =
  | "moderation_block"
  | "limit_reached"
  | "provider_error"
  | "validation_error"
  | "usage_reserved"
  | "usage_consumed"
  | "usage_released"
  | "usage_limit_reached"
  | "usage_regeneration"
  | "usage_contextual_action"
  | "usage_rate_limited"
  | "attachment_selected"
  | "attachment_upload_started"
  | "attachment_upload_completed"
  | "attachment_upload_failed"
  | "attachment_removed"
  | "attachment_processing_completed"
  | "attachment_processing_failed"
  | "message_sent_with_attachment";

export type LogChatEventInput = {
  userId: string;
  bookId: string | null;
  context: ChatContext;
  eventType: ChatEventType;
  code: string;
  message?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export interface ChatRepository {
  getUsage(userId: string, bookId: string, context: ChatContext): Promise<number>;
  getMonthlyUsage(userId: string, context?: ChatContext): Promise<number>;
  incrementUsage(userId: string, bookId: string, context: ChatContext): Promise<number>;
  persistMessages(input: PersistChatInput): Promise<void>;
  logEvent(input: LogChatEventInput): Promise<void>;
  listMessages(
    userId: string,
    bookId: string,
    context: ChatContext,
    conversationId?: string | null,
  ): Promise<ChatConversationMessage[]>;
}

const mockUsage = new Map<string, number>();
const mockMessages = new Map<string, ChatConversationMessage[]>();

export class MockChatRepository implements ChatRepository {
  async getUsage(userId: string, bookId: string, context: ChatContext): Promise<number> {
    const key = `${userId}:${context}:${bookId}:${new Date().toISOString().slice(0, 7)}`;
    return mockUsage.get(key) ?? 0;
  }

  async getMonthlyUsage(userId: string, context?: ChatContext): Promise<number> {
    const month = new Date().toISOString().slice(0, 7);
    const prefix = context ? `${userId}:${context}:` : `${userId}:`;

    return Array.from(mockUsage.entries()).reduce((total, [key, value]) => {
      return key.startsWith(prefix) && key.endsWith(month) ? total + value : total;
    }, 0);
  }

  async incrementUsage(userId: string, bookId: string, context: ChatContext): Promise<number> {
    const key = `${userId}:${context}:${bookId}:${new Date().toISOString().slice(0, 7)}`;
    const next = (mockUsage.get(key) ?? 0) + 1;
    mockUsage.set(key, next);
    return next;
  }

  async persistMessages(input: PersistChatInput): Promise<void> {
    const key = `${input.userId}:${input.context}:${input.conversationId ?? input.bookId}`;
    const current = mockMessages.get(key) ?? [];
    mockMessages.set(key, [
      ...current,
      { role: "user", content: input.userMessage },
      { role: "assistant", content: input.assistantMessage },
    ]);
  }

  async logEvent(): Promise<void> {
    return;
  }

  async listMessages(
    userId: string,
    bookId: string,
    context: ChatContext,
    conversationId?: string | null,
  ): Promise<ChatConversationMessage[]> {
    return mockMessages.get(`${userId}:${context}:${conversationId ?? bookId}`) ?? [];
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

  async getMonthlyUsage(userId: string, context?: ChatContext): Promise<number> {
    const supabase = this.getClient();
    const month = `${new Date().toISOString().slice(0, 7)}-01`;
    let query = supabase
      .from("chat_usage")
      .select("question_count")
      .eq("user_id", userId)
      .eq("month", month);

    if (context) {
      query = query.eq("context", context);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).reduce(
      (total, item) => total + item.question_count,
      0,
    );
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
        conversation_id: input.conversationId ?? null,
        role: "user",
        content: input.userMessage,
      },
      {
        user_id: input.userId,
        book_id: input.bookId,
        context: input.context,
        conversation_id: input.conversationId ?? null,
        role: "assistant",
        content: input.assistantMessage,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }
  }

  async logEvent(input: LogChatEventInput): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.from("chat_events").insert({
      user_id: input.userId,
      book_id: input.bookId,
      context: input.context,
      event_type: input.eventType,
      code: input.code,
      message: input.message ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error("Chat event logging failed", error);
    }
  }

  async listMessages(
    userId: string,
    bookId: string,
    context: ChatContext,
    conversationId?: string | null,
  ): Promise<ChatConversationMessage[]> {
    const supabase = this.getClient();
    let query = supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("context", context)
      .eq("book_id", bookId);

    query = conversationId
      ? query.eq("conversation_id", conversationId)
      : query.is("conversation_id", null);

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        message.role === "user" || message.role === "assistant",
    );
  }
}

export function createChatRepository(accessToken?: string): ChatRepository {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockChatRepository();
  }

  void accessToken;

  return new SupabaseChatRepository();
}
