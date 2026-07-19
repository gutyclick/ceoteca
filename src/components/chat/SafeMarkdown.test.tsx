import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SafeMarkdown } from "@/components/chat/SafeMarkdown";

describe("SafeMarkdown", () => {
  const writeText = vi.fn<() => Promise<void>>();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  });

  it("renderiza contenido estructurado y descarta HTML crudo", () => {
    render(<SafeMarkdown content={'## Plan\n\n- Paso uno\n- Paso dos\n\n[Fuente](https://example.com)\n\n<script>alert("x")</script>'} />);

    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Fuente" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
  });

  it("permite copiar bloques de código con feedback accesible", async () => {
    render(<SafeMarkdown content={'```ts\nconst idea = "acción";\n```'} />);

    fireEvent.click(screen.getByRole("button", { name: "Copiar código" }));

    expect(writeText).toHaveBeenCalledWith('const idea = "acción";');
    expect(await screen.findByText("Copiado", { selector: "button" })).toBeInTheDocument();
  });
});
