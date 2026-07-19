import type { ConversationType } from "@/lib/chat/model";

const draftPrefix = "ceoteca:chat:draft:v2:";
const draftMaxAgeMs = 30 * 24 * 60 * 60 * 1_000;

export type ChatDraftScope = {
  userId: string;
  type: ConversationType;
  conversationId?: string | null;
  bookId?: string | null;
};

type StoredDraft = {
  value: string;
  updatedAt: string;
};

function segment(value: string | null | undefined, fallback: string) {
  return encodeURIComponent(value?.trim() || fallback);
}

export function getChatDraftKey(scope: ChatDraftScope) {
  const contextId = scope.conversationId
    ? `conversation:${segment(scope.conversationId, "new")}`
    : scope.type === "book"
      ? `book:${segment(scope.bookId, "unknown")}`
      : "new";
  return `${draftPrefix}${segment(scope.userId, "anonymous")}:${scope.type}:${contextId}`;
}

export function readChatDraft(scope: ChatDraftScope) {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem(getChatDraftKey(scope));
  if (!raw) return "";
  try {
    const draft = JSON.parse(raw) as StoredDraft;
    return typeof draft.value === "string" ? draft.value : "";
  } catch {
    return raw;
  }
}

export function writeChatDraft(scope: ChatDraftScope, value: string) {
  if (typeof window === "undefined") return;
  const key = getChatDraftKey(scope);
  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }
  const draft: StoredDraft = { value, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(key, JSON.stringify(draft));
}

export function clearChatDraft(scope: ChatDraftScope) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getChatDraftKey(scope));
}

export function cleanupOldChatDrafts(now = Date.now()) {
  if (typeof window === "undefined") return;
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(draftPrefix)) continue;
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const draft = JSON.parse(raw) as StoredDraft;
      const updatedAt = new Date(draft.updatedAt).getTime();
      if (!Number.isFinite(updatedAt) || now - updatedAt > draftMaxAgeMs) {
        window.localStorage.removeItem(key);
      }
    } catch {
      window.localStorage.removeItem(key);
    }
  }
}
