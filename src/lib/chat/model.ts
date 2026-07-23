import type { Json } from "@/lib/supabase/database.types";

export const conversationTypes = ["general", "book"] as const;
export const conversationStatuses = ["active", "archived"] as const;
export const messageRoles = ["user", "assistant", "system", "tool"] as const;
export const messageStatuses = ["pending", "streaming", "completed", "stopped", "interrupted", "failed"] as const;

export type ConversationType = (typeof conversationTypes)[number];
export type ConversationStatus = (typeof conversationStatuses)[number];
export type MessageRole = (typeof messageRoles)[number];
export type MessageStatus = (typeof messageStatuses)[number];

export type ChatConversation = {
  id: string;
  userId: string;
  type: ConversationType;
  bookId: string | null;
  title: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  metadata: Json;
  titleIsManual: boolean;
};

export type StoredChatMessage = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  parts: Json | null;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  parentMessageId: string | null;
  metadata: Json;
  clientMessageId: string | null;
};

export type ChatConversationRow = {
  id: string;
  user_id: string;
  type: ConversationType;
  book_id: string | null;
  title: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  metadata: Json;
  title_is_manual: boolean;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string | null;
  role: MessageRole;
  content: string;
  parts: Json | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  parent_message_id: string | null;
  metadata: Json;
  client_message_id: string | null;
};

export function mapConversation(row: ChatConversationRow): ChatConversation {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    bookId: row.book_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    metadata: row.metadata,
    titleIsManual: row.title_is_manual,
  };
}

export function mapStoredMessage(row: ChatMessageRow): StoredChatMessage | null {
  if (!row.conversation_id) return null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    parts: row.parts,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentMessageId: row.parent_message_id,
    metadata: row.metadata,
    clientMessageId: row.client_message_id,
  };
}

export function generateConversationTitle(message: string) {
  const ignoredWords = new Set([
    "a", "al", "algo", "ayúdame", "como", "cómo", "con", "de", "el", "en", "es",
    "esta", "este", "hacer", "la", "las", "le", "lo", "los", "me", "mi", "para",
    "pero", "puedo", "que", "qué", "quiero", "se", "sin", "soy", "su", "un", "una", "y",
  ]);
  const words = message
    .replace(/[¿?¡!.,;:()\[\]{}"“”]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !ignoredWords.has(word.toLocaleLowerCase("es")));
  const selected = words.slice(0, 7);

  if (selected.length >= 3) {
    const title = selected.join(" ");
    return title.charAt(0).toLocaleUpperCase("es") + title.slice(1);
  }
  if (selected.length === 2) return `Conversación sobre ${selected.join(" ")}`;
  if (selected.length === 1) return `Conversación sobre ${selected[0]}`;
  return "Nueva conversación";
}

export function sortConversations(conversations: ChatConversation[]) {
  return [...conversations].sort(
    (left, right) =>
      new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
  );
}
