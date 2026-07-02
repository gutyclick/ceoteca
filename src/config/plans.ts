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
    tagline: "Para empezar",
    description: "Explora Ceoteca, descubre análisis seleccionados y conoce la experiencia.",
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    chatMonthlyLimit: 0,
    bookLimit: 3,
    features: [],
    highlights: [
      "3 análisis para comenzar",
      "Biblioteca con vista previa",
      "Sin audio",
      "Sin chat con IA",
    ],
    ctaLabel: "Empezar gratis",
  },
  pro: {
    key: "pro",
    name: "Pro",
    tagline: "Para avanzar cada semana",
    description: "Accede al catálogo completo, audio y apoyo contextual de CEO.",
    monthlyPriceUsd: 7.99,
    annualPriceUsd: 79.99,
    chatMonthlyLimit: 50,
    bookLimit: null,
    features: ["allBooks", "audio", "chat", "advancedActivities"],
    highlights: [
      "Catálogo completo de análisis",
      "Audio incluido",
      "50 preguntas a CEO al mes",
      "Actividades, progreso e historial",
    ],
    ctaLabel: "Elegir Pro",
    isRecommended: true,
  },
  unlimited: {
    key: "unlimited",
    name: "Ilimitado",
    tagline: "Para aprender sin fricción",
    description: "Todo Pro, más acceso anticipado y consultas ampliadas con CEO.",
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
      "Consultas ampliadas con uso responsable",
      "Acceso anticipado a nuevos análisis",
      "Funciones premium prioritarias",
    ],
    ctaLabel: "Elegir Ilimitado",
  },
  founder: {
    key: "founder",
    name: "Fundador",
    tagline: "Primeros 100 miembros",
    description:
      "Asegura una tarifa especial de lanzamiento mientras mantengas tu suscripción activa.",
    monthlyPriceUsd: 4.99,
    annualPriceUsd: 49.99,
    setupFeeUsd: 20,
    chatMonthlyLimit: 50,
    bookLimit: null,
    features: ["allBooks", "audio", "chat", "advancedActivities"],
    highlights: [
      "Cupo limitado a 100 fundadores",
      "Tarifa protegida de lanzamiento",
      "Catálogo completo, audio y CEO",
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
    question: "¿Ceoteca reemplaza la lectura del libro original?",
    answer:
      "No. Ceoteca ofrece análisis editoriales propios para ayudarte a entender ideas clave, aplicarlas y decidir qué libros quieres profundizar en su versión completa.",
  },
  {
    question: "¿Qué incluye el plan Gratis?",
    answer:
      "El plan Gratis te permite explorar una selección limitada de análisis y conocer la experiencia. El audio, CEO y el catálogo completo están disponibles desde Pro.",
  },
  {
    question: "¿Puedo cambiar de plan después?",
    answer:
      "Sí. Puedes empezar gratis y mejorar tu plan cuando necesites más acceso. Cuando esté activa una suscripción de pago, podrás gestionarla desde tu cuenta.",
  },
  {
    question: "¿Qué significa el plan Fundador?",
    answer:
      "Es una oferta limitada para los primeros 100 miembros. Mantienes una tarifa mensual especial mientras tu suscripción siga activa.",
  },
  {
    question: "¿Qué puede hacer CEO, la IA de Ceoteca?",
    answer:
      "CEO te ayuda a elegir análisis, construir rutas de lectura, aplicar ideas a tu contexto y resolver dudas sobre el contenido autorizado de Ceoteca.",
  },
  {
    question: "¿El audio está incluido en todos los planes?",
    answer:
      "El audio está incluido desde Pro. En el plan Gratis puedes explorar la biblioteca y leer análisis seleccionados sin audio ni chat con IA.",
  },
] as const;
