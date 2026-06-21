import type { FeatureKey } from "@/config/features";

export const planKeys = ["free", "pro", "unlimited", "founder"] as const;

export type PlanKey = (typeof planKeys)[number];

export type PlanConfig = {
  key: PlanKey;
  name: string;
  tagline: string;
  description: string;
  monthlyPriceUsd: number;
  annualPriceUsd?: number;
  setupFeeUsd?: number;
  chatMonthlyLimit: number | null;
  bookLimit: number | null;
  features: FeatureKey[];
  highlights: string[];
  ctaLabel: string;
  isRecommended?: boolean;
  isFounderOffer?: boolean;
};

export const plans: Record<PlanKey, PlanConfig> = {
  free: {
    key: "free",
    name: "Gratis",
    tagline: "Para explorar",
    description: "Prueba la biblioteca con acceso limitado y sin compromiso.",
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    chatMonthlyLimit: 0,
    bookLimit: 3,
    features: [],
    highlights: [
      "3 libros incluidos",
      "Vista previa de biblioteca",
      "Sin audio",
      "Sin chat con IA",
    ],
    ctaLabel: "Empezar gratis",
  },
  pro: {
    key: "pro",
    name: "Pro",
    tagline: "Para aprender cada semana",
    description: "Accede a todos los libros, audio y chat contextual mensual.",
    monthlyPriceUsd: 7.99,
    annualPriceUsd: 79.99,
    chatMonthlyLimit: 50,
    bookLimit: null,
    features: ["allBooks", "audio", "chat", "advancedActivities"],
    highlights: [
      "Todos los libros publicados",
      "Audio incluido",
      "50 preguntas de chat al mes",
      "Actividades e historial",
    ],
    ctaLabel: "Elegir Pro",
    isRecommended: true,
  },
  unlimited: {
    key: "unlimited",
    name: "Ilimitado",
    tagline: "Para usuarios intensivos",
    description: "Todo Pro, más acceso anticipado y chat sujeto a uso razonable.",
    monthlyPriceUsd: 14.99,
    annualPriceUsd: 149.99,
    chatMonthlyLimit: null,
    bookLimit: null,
    features: [
      "allBooks",
      "audio",
      "chat",
      "unlimitedChat",
      "earlyAccess",
      "advancedActivities",
    ],
    highlights: [
      "Todo lo incluido en Pro",
      "Chat sujeto a uso razonable",
      "Acceso anticipado",
      "Funciones premium futuras",
    ],
    ctaLabel: "Elegir Ilimitado",
  },
  founder: {
    key: "founder",
    name: "Fundador",
    tagline: "Oferta limitada",
    description:
      "Entrada inicial y tarifa protegida mientras mantengas la suscripción.",
    monthlyPriceUsd: 4.99,
    annualPriceUsd: 49.99,
    setupFeeUsd: 20,
    chatMonthlyLimit: 50,
    bookLimit: null,
    features: ["allBooks", "audio", "chat", "advancedActivities"],
    highlights: [
      "Entrada inicial de USD 20",
      "USD 4.99 al mes",
      "Límite de 100 usuarios",
      "Beneficios equivalentes a Pro",
    ],
    ctaLabel: "Reservar fundador",
    isFounderOffer: true,
  },
};

export const billingPeriods = ["monthly", "annual"] as const;

export type BillingPeriod = (typeof billingPeriods)[number];

export const pricingFeatureRows = [
  {
    label: "Libros incluidos",
    values: {
      free: "3 libros",
      pro: "Todos",
      unlimited: "Todos",
      founder: "Todos",
    },
  },
  {
    label: "Audio",
    values: {
      free: "No incluido",
      pro: "Incluido",
      unlimited: "Incluido",
      founder: "Incluido",
    },
  },
  {
    label: "Chat con IA",
    values: {
      free: "No incluido",
      pro: "50 preguntas/mes",
      unlimited: "Uso razonable",
      founder: "50 preguntas/mes",
    },
  },
  {
    label: "Actividades",
    values: {
      free: "Vista previa",
      pro: "Incluidas",
      unlimited: "Incluidas",
      founder: "Incluidas",
    },
  },
  {
    label: "Acceso anticipado",
    values: {
      free: "No",
      pro: "No",
      unlimited: "Sí",
      founder: "No",
    },
  },
] as const satisfies Array<{
  label: string;
  values: Record<PlanKey, string>;
}>;

export const pricingFaqs = [
  {
    question: "¿Los pagos ya están activos?",
    answer:
      "No. La integración de pagos está pendiente y no se simula ningún cobro éxitoso.",
  },
  {
    question: "¿Necesito tarjeta para empezar?",
    answer:
      "No. Puedes crear una cuenta gratis; los pagos quedan pendientes hasta activar un proveedor real.",
  },
  {
    question: "¿Puedo cambiar de plan después?",
    answer:
      "La gestión visual está planificada; los cambios reales dependerán del proveedor de pagos definido.",
  },
  {
    question: "¿Qué significa uso razonable?",
    answer:
      "Es una política futura para prevenir abuso del chat sin afectar el uso normal de aprendizaje.",
  },
] as const;
