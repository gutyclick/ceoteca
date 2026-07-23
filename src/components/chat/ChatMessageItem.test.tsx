import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatMessageItem } from "@/components/chat/ChatMessageItem";
import type { StoredChatMessage } from "@/lib/chat/model";

function message(overrides: Partial<StoredChatMessage> = {}): StoredChatMessage {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    clientMessageId: null,
    role: "assistant",
    content: "Una respuesta de **CEO**.",
    parts: null,
    status: "completed",
    createdAt: "2026-07-18T14:00:00.000Z",
    updatedAt: "2026-07-18T14:00:00.000Z",
    parentMessageId: "message-user",
    metadata: {},
    ...overrides,
  };
}

function handlers() {
  return {
    onContinue: vi.fn(),
    onDeleteUser: vi.fn(),
    onEditPrevious: vi.fn(),
    onEditUser: vi.fn(),
    onRate: vi.fn(),
    onRegenerate: vi.fn(),
    onResendUser: vi.fn(),
    onResponseAction: vi.fn(),
  };
}

describe("ChatMessageItem", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("distingue el mensaje del usuario y ofrece edición", () => {
    const actions = handlers();
    const userMessage = message({ role: "user", content: "Quiero mejorar mi propuesta", parentMessageId: null });
    render(<ChatMessageItem {...actions} message={userMessage} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar mensaje" }));

    expect(screen.getByLabelText("Mensaje del usuario")).toHaveTextContent(userMessage.content);
    expect(actions.onEditUser).toHaveBeenCalledWith(userMessage);
  });

  it("permite valorar una respuesta completada", () => {
    const actions = handlers();
    const assistantMessage = message();
    render(<ChatMessageItem {...actions} message={assistantMessage} />);

    fireEvent.click(screen.getByRole("button", { name: "Marcar como útil" }));

    expect(actions.onRate).toHaveBeenCalledWith(assistantMessage, "helpful");
  });

  it("muestra recuperación contextual cuando falla", () => {
    const actions = handlers();
    const failedMessage = message({ content: "", status: "failed" });
    render(<ChatMessageItem {...actions} message={failedMessage} />);

    expect(screen.getByText("CEO no pudo completar esta respuesta.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(actions.onRegenerate).toHaveBeenCalledWith(failedMessage);
  });

  it("conserva el contenido parcial cuando el streaming se interrumpe", () => {
    const actions = handlers();
    const interrupted = message({ content: "Respuesta parcial conservada", status: "interrupted" });
    render(<ChatMessageItem {...actions} message={interrupted} />);

    expect(screen.getByText("Respuesta parcial conservada")).toBeInTheDocument();
    expect(screen.getByText("La respuesta se interrumpió.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver a generar" }));
    expect(actions.onRegenerate).toHaveBeenCalledWith(interrupted);
  });
});
