import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContinueTrainingCard } from "@/components/training/ContinueTrainingCard";
import { TrainingView } from "@/components/training/TrainingView";
import type { TrainingHomeViewModel } from "@/lib/training/navigation-model";
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
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/env", () => ({
  clientEnv: { NEXT_PUBLIC_TRAINING_DATA_SOURCE: "mock" },
}));
vi.mock("@/lib/training/api-client", () => ({
  getTrainingNavigationHome: () => Promise.reject(new Error("offline")),
  trackTrainingNavigationEvent: () => Promise.resolve({ accepted: true }),
  getAdaptiveRecommendation: () => Promise.reject(new Error("offline")),
  acceptAdaptiveRecommendation: vi.fn(),
  createRemoteTraining: vi.fn(),
}));

const navigation: TrainingHomeViewModel = {
  recommendation: null,
  continueItems: [],
  modes: [
    {
      slug: "analiza",
      name: "Analiza",
      description: "Desarrolla criterio.",
      skillCount: 2,
      exerciseCount: null,
      accessState: "available",
    },
  ],
  categories: [
    {
      slug: "marketing-y-marca",
      name: "Marketing y marca",
      shortDescription: "Construye marcas relevantes.",
      description: "",
      icon: "Megaphone",
      progress: 0,
      skillCount: 2,
      exerciseCount: null,
      highlightedSkills: ["Propuesta de valor"],
      availableModes: ["analiza"],
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
      exerciseCount: null,
      highlightedSkills: [],
      availableModes: ["analiza"],
      accessState: "available",
      minimumPlan: "free",
    },
  ],
  pathPreviews: [
    {
      slug: "aprende-a-vender",
      name: "Aprende a vender",
      promise: "Mejora tu criterio comercial.",
      estimatedMinutes: 30,
      moduleCount: 3,
      minimumPlan: "free",
      accessState: "available",
    },
  ],
  progressSummary: {
    skillsPracticed: 0,
    reviewsPending: 0,
    exercisesCompleted: 0,
  },
  reviews: { pending: 0, label: "Estás al día" },
  roleplayPreview: null,
};

describe("TrainingView", () => {
  it("muestra navegación, taxonomía y estados del ViewModel", () => {
    render(
      <TrainingView features={{ roleplay: true }} navigation={navigation} />,
    );
    expect(
      screen.getByRole("heading", { name: "Training", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Entrenamiento de hoy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tu progreso" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Rutas recomendadas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Simulaciones conversacionales" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Marketing y marca")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Continúa donde lo dejaste" }),
    ).not.toBeInTheDocument();
  });
  it("permite alcanzar una categoría con teclado", async () => {
    const user = userEvent.setup();
    render(<TrainingView navigation={navigation} />);
    const marketing = screen.getByRole("link", { name: /Marketing/i });
    marketing.focus();
    expect(marketing).toHaveFocus();
    expect(marketing).toHaveAttribute(
      "href",
      "/ejercicios/categorias/marketing-y-marca",
    );
    await user.keyboard("{Tab}");
    expect(
      screen.getByRole("link", { name: /Ventas y persuasión/i }),
    ).toHaveFocus();
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
    render(
      <ContinueTrainingCard
        activity={{ ...baseActivity, status: "loading" }}
      />,
    );
    expect(screen.getByLabelText("Cargando entrenamiento")).toBeInTheDocument();
  });
});
