import { describe, expect, it } from "vitest";

import { generateConversationTitle, sortConversations, type ChatConversation } from "@/lib/chat/model";

function conversation(id: string, lastMessageAt: string): ChatConversation {
  return {
    id,
    userId: "user-1",
    type: "general",
    bookId: null,
    title: id,
    status: "active",
    createdAt: lastMessageAt,
    updatedAt: lastMessageAt,
    lastMessageAt,
    metadata: {},
    titleIsManual: false,
  };
}

describe("generateConversationTitle", () => {
  it("genera un título descriptivo de un máximo de siete palabras", () => {
    expect(
      generateConversationTitle("¿Cómo puedo validar una idea de negocio sin gastar demasiado?"),
    ).toBe("Cómo puedo validar una idea de negocio");
  });

  it("completa mensajes muy cortos con un título legible", () => {
    expect(generateConversationTitle("Productividad")).toBe("Conversación sobre Productividad");
  });
});

describe("sortConversations", () => {
  it("ordena por el mensaje más reciente sin mutar la lista original", () => {
    const older = conversation("older", "2026-01-01T10:00:00.000Z");
    const newer = conversation("newer", "2026-01-02T10:00:00.000Z");
    const input = [older, newer];

    expect(sortConversations(input).map((item) => item.id)).toEqual(["newer", "older"]);
    expect(input.map((item) => item.id)).toEqual(["older", "newer"]);
  });
});
