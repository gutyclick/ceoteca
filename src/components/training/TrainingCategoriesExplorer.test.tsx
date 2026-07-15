import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TrainingCategoriesExplorer } from "@/components/training/TrainingCategoriesExplorer";
import type { TrainingCategoryCardViewModel } from "@/lib/training/navigation-model";

vi.mock("@/lib/training/api-client", () => ({
  getTrainingNavigationCategories: () => Promise.reject(new Error("offline")),
  trackTrainingNavigationEvent: () => Promise.resolve({ accepted: true }),
}));

const categories: TrainingCategoryCardViewModel[] = [
  {
    slug: "marketing-y-marca",
    name: "Marketing y marca",
    shortDescription: "Construye marcas relevantes.",
    description: "",
    icon: "Megaphone",
    progress: 35,
    skillCount: 2,
    exerciseCount: 4,
    highlightedSkills: ["Propuesta de valor"],
    availableModes: ["analiza", "construye"],
    accessState: "available",
    minimumPlan: "free",
  },
  {
    slug: "ventas-y-persuasion",
    name: "Ventas y persuasión",
    shortDescription: "Mejora conversaciones comerciales.",
    description: "",
    icon: "BadgeDollarSign",
    progress: 0,
    skillCount: 1,
    exerciseCount: 1,
    highlightedSkills: ["Objeciones"],
    availableModes: ["practica"],
    accessState: "locked",
    minimumPlan: "pro",
  },
];

describe("TrainingCategoriesExplorer", () => {
  it("filtra por modo, plan y texto sin perder accesibilidad", async () => {
    const user = userEvent.setup();
    render(<TrainingCategoriesExplorer categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Practica" }));
    expect(screen.queryByText("Marketing y marca")).not.toBeInTheDocument();
    expect(screen.getByText("Ventas y persuasión")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Plan"), "free");
    expect(
      screen.getByText("No encontramos coincidencias"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await user.type(screen.getByLabelText("Buscar una habilidad"), "propuesta");
    expect(screen.getByText("Marketing y marca")).toBeInTheDocument();
    expect(screen.queryByText("Ventas y persuasión")).not.toBeInTheDocument();
  });

  it("expone el estado bloqueado y un enlace descriptivo", () => {
    render(<TrainingCategoriesExplorer categories={categories} />);
    expect(screen.getByText("Requiere otro plan")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explorar Ventas y persuasión" }),
    ).toHaveAttribute("href", "/ejercicios/categorias/ventas-y-persuasion");
  });
});
