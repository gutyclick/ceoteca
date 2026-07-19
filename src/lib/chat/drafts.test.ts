import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanupOldChatDrafts,
  clearChatDraft,
  getChatDraftKey,
  readChatDraft,
  writeChatDraft,
  type ChatDraftScope,
} from "@/lib/chat/drafts";

const generalDraft: ChatDraftScope = { userId: "user-1", type: "general", conversationId: "chat-1" };

describe("chat drafts", () => {
  beforeEach(() => window.localStorage.clear());

  it("separa borradores por usuario, conversación y libro", () => {
    const newConversation: ChatDraftScope = { userId: "user-1", type: "general" };
    const bookConversation: ChatDraftScope = { userId: "user-1", type: "book", bookId: "book-1" };
    const anotherUser: ChatDraftScope = { ...generalDraft, userId: "user-2" };

    writeChatDraft(newConversation, "Mensaje nuevo");
    writeChatDraft(generalDraft, "Mensaje del chat");
    writeChatDraft(bookConversation, "Pregunta del libro");

    expect(readChatDraft(newConversation)).toBe("Mensaje nuevo");
    expect(readChatDraft(generalDraft)).toBe("Mensaje del chat");
    expect(readChatDraft(bookConversation)).toBe("Pregunta del libro");
    expect(readChatDraft(anotherUser)).toBe("");
    expect(new Set([newConversation, generalDraft, bookConversation].map(getChatDraftKey)).size).toBe(3);
  });

  it("elimina el borrador después de confirmarlo", () => {
    writeChatDraft(generalDraft, "Temporal");
    clearChatDraft(generalDraft);
    expect(readChatDraft(generalDraft)).toBe("");
  });

  it("limpia borradores antiguos sin tocar los recientes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T10:00:00Z"));
    writeChatDraft(generalDraft, "Reciente");
    const oldScope: ChatDraftScope = { ...generalDraft, conversationId: "old" };
    window.localStorage.setItem(
      getChatDraftKey(oldScope),
      JSON.stringify({ value: "Antiguo", updatedAt: "2026-05-01T10:00:00Z" }),
    );

    cleanupOldChatDrafts();

    expect(readChatDraft(generalDraft)).toBe("Reciente");
    expect(readChatDraft(oldScope)).toBe("");
    vi.useRealTimers();
  });
});
