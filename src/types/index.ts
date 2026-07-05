import type { PlanKey } from "@/config/plans";

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  plan: PlanKey;
  isDemo: boolean;
};

export type BookCategory =
  | "Emprendimiento"
  | "Ventas"
  | "Marketing"
  | "Finanzas personales"
  | "Inversiones"
  | "Ingresos y riqueza"
  | "Desarrollo personal"
  | "Liderazgo"
  | "Productividad"
  | "Psicología y comportamiento"
  | "Estrategia empresarial"
  | "Comunicación"
  | "Negociación"
  | "Innovación y tecnología"
  | "Biografías y casos de éxito";

export type BookDifficulty = "Inicial" | "Intermedio" | "Avanzado";

export type CoverVariant = "orb" | "steps" | "bolt" | "growth" | "people" | "grid";

export type CoverConfig = {
  variant: CoverVariant;
  gradient: string;
  accent: string;
  imagePath?: string;
};

export type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: BookCategory;
  description: string;
  readingTime: number;
  difficulty: BookDifficulty;
  tags: string[];
  cover: CoverConfig;
  isFeatured?: boolean;
  isPublished: boolean;
  isDemoContent: boolean;
  progress?: number;
  purchaseUrl?: string;
  analysis: BookSection[];
  keyPoints: KeyPoint[];
  activities: BookActivity[];
  conclusion: string;
};

export type BookSection = {
  title: string;
  content: string;
};

export type KeyPoint = {
  number: number;
  title: string;
  explanation: string;
  example: string;
  action: string;
  limitation: string;
};

export type BookActivity = {
  title: string;
  prompt: string;
  type: "reflection" | "checklist" | "scenario";
  options?: string[];
};
