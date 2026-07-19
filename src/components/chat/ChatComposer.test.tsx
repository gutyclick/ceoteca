import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatComposer } from "@/components/chat/ChatComposer";

function ComposerHarness({
  onSubmit,
  maxLength = 2_000,
  isStreaming = false,
  onStop,
}: {
  onSubmit: () => void;
  maxLength?: number;
  isStreaming?: boolean;
  onStop?: () => void;
}) {
  const [value, setValue] = useState("");
  const textareaRef = createRef<HTMLTextAreaElement>();

  return (
    <ChatComposer
      isStreaming={isStreaming}
      maxLength={maxLength}
      onChange={setValue}
      onStop={onStop}
      onSubmit={onSubmit}
      textareaRef={textareaRef}
      value={value}
    />
  );
}

describe("ChatComposer", () => {
  it("envía con Enter y conserva Shift+Enter para saltos de línea", () => {
    const onSubmit = vi.fn();
    render(<ComposerHarness onSubmit={onSubmit} />);
    const textarea = screen.getByRole("textbox", { name: "Mensaje para CEO" });

    fireEvent.change(textarea, { target: { value: "Analiza esta idea" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("no envía mientras existe una composición IME", () => {
    const onSubmit = vi.fn();
    render(<ComposerHarness onSubmit={onSubmit} />);
    const textarea = screen.getByRole("textbox", { name: "Mensaje para CEO" });

    fireEvent.change(textarea, { target: { value: "Mensaje" } });
    fireEvent.compositionStart(textarea);
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("permite superar el límite sin truncar y bloquea el envío", () => {
    const onSubmit = vi.fn();
    render(<ComposerHarness maxLength={10} onSubmit={onSubmit} />);
    const textarea = screen.getByRole("textbox", { name: "Mensaje para CEO" });

    fireEvent.change(textarea, { target: { value: "12345678901" } });
    expect(textarea).toHaveValue("12345678901");
    expect(textarea).not.toHaveAttribute("maxlength");
    expect(screen.getByRole("alert")).toHaveTextContent("Tu mensaje es demasiado largo");
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("permite escribir durante streaming y ofrece detener", () => {
    const onStop = vi.fn();
    render(<ComposerHarness isStreaming onStop={onStop} onSubmit={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: "Mensaje para CEO" });
    fireEvent.change(textarea, { target: { value: "Siguiente mensaje" } });

    expect(textarea).not.toBeDisabled();
    expect(screen.getByText(/Espera a que CEO termine/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Detener respuesta" }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("bloquea dos envíos producidos en el mismo instante", () => {
    const onSubmit = vi.fn();
    render(<ComposerHarness onSubmit={onSubmit} />);
    const textarea = screen.getByRole("textbox", { name: "Mensaje para CEO" });
    fireEvent.change(textarea, { target: { value: "Enviar una sola vez" } });
    const button = screen.getByRole("button", { name: "Enviar mensaje" });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
