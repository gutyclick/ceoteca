import { describe, expect, it } from "vitest";

import { chatRequestSchema } from "@/lib/validation/chat";

const ids = {
  creation: "6e50ef40-fb67-44d2-b89f-9b47c89df6b8",
  message: "3f83d170-d675-49e1-ac66-866eb0e75d32",
};

describe("chatRequestSchema", () => {
  it("acepta una conversación general nueva e idempotente", () => {
    const result = chatRequestSchema.safeParse({
      type: "general",
      clientCreationKey: ids.creation,
      clientMessageId: ids.message,
      message: "Ayúdame a preparar una estrategia.",
    });
    expect(result.success).toBe(true);
  });

  it("exige un libro para conversaciones contextuales", () => {
    const result = chatRequestSchema.safeParse({
      type: "book",
      clientCreationKey: ids.creation,
      clientMessageId: ids.message,
      message: "Explícame la idea principal.",
    });
    expect(result.success).toBe(false);
  });

  it("permite continuar una conversación sin clave de creación", () => {
    const result = chatRequestSchema.safeParse({
      type: "general",
      conversationId: ids.creation,
      clientMessageId: ids.message,
      message: "Continúa.",
    });
    expect(result.success).toBe(true);
  });
});
