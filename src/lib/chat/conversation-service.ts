import {
  generateConversationTitle,
  mapConversation,
  mapStoredMessage,
  type ChatConversation,
  type ChatConversationRow,
  type ChatMessageRow,
  type ConversationType,
  type StoredChatMessage,
} from "@/lib/chat/model";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const conversationFields =
  "id,user_id,type,book_id,title,status,created_at,updated_at,last_message_at,metadata,title_is_manual";
const messageFields =
  "id,conversation_id,role,content,parts,status,created_at,updated_at,parent_message_id,metadata,client_message_id";

export async function listUserConversations(userId: string) {
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_conversations")
    .select(conversationFields)
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ChatConversationRow[]).map(mapConversation);
}

export async function getUserConversation(userId: string, conversationId: string) {
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_conversations")
    .select(conversationFields)
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapConversation(data as ChatConversationRow) : null;
}

type EnsureConversationInput = {
  userId: string;
  conversationId?: string;
  clientCreationKey?: string;
  type: ConversationType;
  bookId: string | null;
  bookTitle?: string;
};

export async function ensureConversation(input: EnsureConversationInput) {
  if (input.conversationId) {
    const existing = await getUserConversation(input.userId, input.conversationId);
    if (!existing || existing.type !== input.type || existing.bookId !== input.bookId) {
      return null;
    }
    return existing;
  }

  if (!input.clientCreationKey) return null;
  const client = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("chat_conversations")
    .insert({
      user_id: input.userId,
      context: input.type === "book" ? "book" : "site",
      type: input.type,
      book_id: input.bookId,
      title: "Nueva conversación",
      status: "active",
      archived_at: null,
      last_message_at: now,
      client_creation_key: input.clientCreationKey,
      metadata: input.bookTitle ? { bookTitle: input.bookTitle } : {},
    })
    .select(conversationFields)
    .maybeSingle();

  if (!error && data) return mapConversation(data as ChatConversationRow);

  const { data: duplicate, error: duplicateError } = await client
    .from("chat_conversations")
    .select(conversationFields)
    .eq("user_id", input.userId)
    .eq("client_creation_key", input.clientCreationKey)
    .maybeSingle();

  if (duplicateError || !duplicate) {
    throw new Error(error?.message ?? duplicateError?.message ?? "Conversation creation failed");
  }
  return mapConversation(duplicate as ChatConversationRow);
}

export async function listConversationMessages(
  userId: string,
  conversationId: string,
  options: { completedOnly?: boolean; before?: string; limit?: number } = {},
) {
  const conversation = await getUserConversation(userId, conversationId);
  if (!conversation) return null;

  const client = createServiceSupabaseClient();
  let query = client
    .from("chat_messages")
    .select(messageFields)
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (options.completedOnly) query = query.eq("status", "completed");
  if (options.before) query = query.lt("created_at", options.before);
  const requestedLimit = options.limit ? Math.min(Math.max(options.limit, 1), 80) : null;
  if (requestedLimit) query = query.limit(requestedLimit + 1);
  const { data, error } = await query.order("created_at", { ascending: requestedLimit === null });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ChatMessageRow[];
  const hasMore = requestedLimit !== null && rows.length > requestedLimit;
  const selectedRows = requestedLimit ? rows.slice(0, requestedLimit).reverse() : rows;

  return {
    conversation,
    hasMore,
    messages: selectedRows
      .map(mapStoredMessage)
      .filter((message): message is StoredChatMessage => message !== null),
  };
}

type ClaimMessageInput = {
  userId: string;
  conversation: ChatConversation;
  clientMessageId: string;
  content: string;
};

export async function claimUserMessage(input: ClaimMessageInput) {
  const client = createServiceSupabaseClient();
  const { data: existing, error: existingError } = await client
    .from("chat_messages")
    .select(messageFields)
    .eq("conversation_id", input.conversation.id)
    .eq("client_message_id", input.clientMessageId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const existingMessage = mapStoredMessage(existing as ChatMessageRow);
    if (!existingMessage) throw new Error("Invalid stored message");
    if (existingMessage.status === "failed") {
      const { error: retryError } = await client
        .from("chat_messages")
        .update({ status: "pending", content: input.content, metadata: {} })
        .eq("id", existingMessage.id)
        .eq("user_id", input.userId);
      if (retryError) throw new Error(retryError.message);
      return {
        created: true as const,
        userMessage: { ...existingMessage, content: input.content, status: "pending" as const, metadata: {} },
        assistantMessage: null,
      };
    }
    const { data: assistant, error: assistantError } = await client
      .from("chat_messages")
      .select(messageFields)
      .eq("parent_message_id", existingMessage.id)
      .eq("role", "assistant")
      .maybeSingle();
    if (assistantError) throw new Error(assistantError.message);
    return {
      created: false as const,
      userMessage: existingMessage,
      assistantMessage: assistant
        ? mapStoredMessage(assistant as ChatMessageRow)
        : null,
    };
  }

  const { data, error } = await client
    .from("chat_messages")
    .insert({
      user_id: input.userId,
      book_id: input.conversation.bookId,
      context: input.conversation.type === "book" ? "book" : "site",
      conversation_id: input.conversation.id,
      role: "user",
      content: input.content,
      status: "pending",
      client_message_id: input.clientMessageId,
      metadata: {},
    })
    .select(messageFields)
    .single();

  if (error || !data) {
    const { data: duplicate, error: duplicateError } = await client
      .from("chat_messages")
      .select(messageFields)
      .eq("conversation_id", input.conversation.id)
      .eq("client_message_id", input.clientMessageId)
      .maybeSingle();
    if (duplicateError || !duplicate) {
      throw new Error(error?.message ?? duplicateError?.message ?? "Message creation failed");
    }
    const duplicateMessage = mapStoredMessage(duplicate as ChatMessageRow);
    if (!duplicateMessage) throw new Error("Invalid duplicate message");
    return { created: false as const, userMessage: duplicateMessage, assistantMessage: null };
  }
  const userMessage = mapStoredMessage(data as ChatMessageRow);
  if (!userMessage) throw new Error("Invalid created message");
  return { created: true as const, userMessage, assistantMessage: null };
}

export async function generateAndPersistConversationTitle(input: {
  userId: string;
  conversation: ChatConversation;
  message: string;
}) {
  if (input.conversation.titleIsManual || input.conversation.title !== "Nueva conversación") {
    return input.conversation.title;
  }

  const title = generateConversationTitle(input.message);
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_conversations")
    .update({ title })
    .eq("id", input.conversation.id)
    .eq("user_id", input.userId)
    .eq("title_is_manual", false)
    .eq("title", "Nueva conversación")
    .select("title")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.title) return data.title;

  const currentConversation = await getUserConversation(input.userId, input.conversation.id);
  return currentConversation?.title ?? input.conversation.title;
}

export async function completeMessageTurn(input: {
  userId: string;
  conversation: ChatConversation;
  userMessageId: string;
  userContent: string;
  assistantContent: string;
}) {
  const client = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const title = input.conversation.title;

  const { data: completedUserMessage, error: userUpdateError } = await client
    .from("chat_messages")
    .update({ status: "completed" })
    .eq("id", input.userMessageId)
    .eq("user_id", input.userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (userUpdateError || !completedUserMessage) {
    throw new Error(userUpdateError?.message ?? "Message is no longer active");
  }

  const [assistantInsert, conversationUpdate] = await Promise.all([
    client
      .from("chat_messages")
      .insert({
        user_id: input.userId,
        book_id: input.conversation.bookId,
        context: input.conversation.type === "book" ? "book" : "site",
        conversation_id: input.conversation.id,
        role: "assistant",
        content: input.assistantContent,
        status: "completed",
        parent_message_id: input.userMessageId,
        metadata: {},
      })
      .select(messageFields)
      .single(),
    client
      .from("chat_conversations")
      .update({
        last_message_at: now,
        status: "active",
        archived_at: null,
      })
      .eq("id", input.conversation.id)
      .eq("user_id", input.userId),
  ]);

  if (assistantInsert.error || conversationUpdate.error) {
    throw new Error(
      assistantInsert.error?.message ??
        conversationUpdate.error?.message ??
        "Message completion failed",
    );
  }

  const assistantMessage = mapStoredMessage(assistantInsert.data as ChatMessageRow);
  if (!assistantMessage) throw new Error("Invalid assistant message");
  return { assistantMessage, title, lastMessageAt: now };
}

export async function cancelMessageTurn(input: {
  userId: string;
  clientMessageId: string;
  partialContent: string;
}) {
  const client = createServiceSupabaseClient();
  const { data: userMessage, error } = await client
    .from("chat_messages")
    .update({ status: input.partialContent.trim() ? "completed" : "failed", metadata: { stopped: true } })
    .eq("user_id", input.userId)
    .eq("client_message_id", input.clientMessageId)
    .in("status", ["pending", "streaming"])
    .select(messageFields)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!userMessage || !input.partialContent.trim()) return { cancelled: Boolean(userMessage), assistantMessage: null };

  const mappedUser = mapStoredMessage(userMessage as ChatMessageRow);
  if (!mappedUser) return { cancelled: false, assistantMessage: null };
  const conversation = await getUserConversation(input.userId, mappedUser.conversationId);
  if (!conversation) return { cancelled: false, assistantMessage: null };
  const { data: assistant, error: assistantError } = await client
    .from("chat_messages")
    .insert({
      user_id: input.userId,
      book_id: conversation.bookId,
      context: conversation.type === "book" ? "book" : "site",
      conversation_id: mappedUser.conversationId,
      role: "assistant",
      content: input.partialContent.trim(),
      status: "stopped",
      parent_message_id: mappedUser.id,
      metadata: { stoppedAt: new Date().toISOString() },
    })
    .select(messageFields)
    .single();
  if (assistantError) throw new Error(assistantError.message);
  return { cancelled: true, assistantMessage: mapStoredMessage(assistant as ChatMessageRow) };
}

export async function failMessageTurn(userId: string, messageId: string, reason: string) {
  const client = createServiceSupabaseClient();
  await client
    .from("chat_messages")
    .update({ status: "failed", metadata: { failureReason: reason.slice(0, 300) } })
    .eq("id", messageId)
    .eq("user_id", userId)
    .in("status", ["pending", "streaming"]);
}
