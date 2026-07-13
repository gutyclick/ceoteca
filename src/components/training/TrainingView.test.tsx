import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContinueTrainingCard } from "@/components/training/ContinueTrainingCard";
import { TrainingView } from "@/components/training/TrainingView";
import type { TrainingActivity } from "@/types/training";

vi.mock("@/components/app/DashboardSidebar", () => ({
  DashboardSidebar: () => <nav aria-label="Navegación del panel" />,
}));
vi.mock("@/components/app/NotificationBell", () => ({
  NotificationBell: () => <button type="button">Notificaciones</button>,
}));
vi.mock("@/components/app/DashboardAccountMenu", () => ({
  DashboardAccountMenu: () => <button type="button">Cuenta</button>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/env", () => ({
  clientEnv: { NEXT_PUBLIC_TRAINING_DATA_SOURCE: "mock" },
}));

describe("TrainingView", () => {
  it("muestra las cinco secciones y sus datos mock", () => {
    render(<TrainingView />);

    expect(screen.getByRole("heading", { name: "Ejercicios", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entrenamiento de hoy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Continúa donde lo dejaste" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Explora por categoría" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tu progreso" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Explorar/i })).toHaveLength(5);
    expect(screen.getByText("Finanzas personales")).toBeInTheDocument();
  });

  it("permite alcanzar una categoría con teclado", async () => {
    const user = userEvent.setup();
    render(<TrainingView />);

    const marketing = screen.getByRole("link", { name: /Marketing/i });
    marketing.focus();
    expect(marketing).toHaveFocus();
    expect(marketing).toHaveAttribute("href", "/ejercicios?categoria=marketing");
    await user.keyboard("{Tab}");
    expect(screen.getByRole("link", { name: /Desarrollo personal/i })).toHaveFocus();
  });
});

describe("ContinueTrainingCard", () => {
  const baseActivity: TrainingActivity = {
    id: "test",
    title: "Entrenamiento de prueba",
    description: "Descripción legible.",
    status: "locked",
    progress: 0,
    detail: "Disponible en Pro",
    ctaLabel: "Continuar",
    icon: "target",
  };

  it("deshabilita una actividad bloqueada", () => {
    render(<ContinueTrainingCard activity={baseActivity} />);
    expect(screen.getByRole("button", { name: "Bloqueado" })).toBeDisabled();
  });

  it("mantiene una estructura estable durante la carga", () => {
    render(<ContinueTrainingCard activity={{ ...baseActivity, status: "loading" }} />);
    expect(screen.getByLabelText("Cargando entrenamiento")).toBeInTheDocument();
  });
});
