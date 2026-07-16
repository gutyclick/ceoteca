import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TaxonomyForm } from "@/components/training/admin/TaxonomyForm";
import type {
  EditorialDetail,
  EditorialMetadata,
} from "@/lib/training/admin-editorial-client";

const saveEditorial = vi.fn();

vi.mock("@/lib/training/admin-editorial-client", () => ({
  createEditorial: vi.fn(),
  saveEditorial: (...args: unknown[]) => saveEditorial(...args),
}));

const detail: EditorialDetail = {
  id: "00000000-0000-4000-8000-000000000001",
  sourceStatus: "draft",
  draft: {
    name: "Ventas",
    slug: "ventas",
  },
  version: {
    id: "00000000-0000-4000-8000-000000000002",
    version: 1,
    status: "draft",
  },
  history: [],
  role: "editor",
};

const metadata: EditorialMetadata = {
  categories: [],
  subcategories: [],
  skills: [],
  concepts: [],
  formats: [],
  exercises: [],
  templates: [],
  scenarios: [],
  books: [],
};

describe("TaxonomyForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    saveEditorial.mockResolvedValue({
      id: detail.id,
      version: 1,
      status: "draft",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("autoguarda una edición válida después del debounce", async () => {
    const onSaved = vi.fn();
    render(
      <TaxonomyForm
        canEdit
        detail={detail}
        metadata={metadata}
        onCreated={vi.fn()}
        onSaved={onSaved}
        resource="categories"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
      target: { value: "Ventas consultivas" },
    });

    expect(saveEditorial).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(950);
    });

    expect(saveEditorial).toHaveBeenCalledTimes(1);
    expect(saveEditorial).toHaveBeenCalledWith(
      "categories",
      detail.id,
      expect.objectContaining({ name: "Ventas consultivas", slug: "ventas" }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Guardado")).toBeInTheDocument();
  });
});
