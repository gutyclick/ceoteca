import { z } from "zod";

export const trainingPlanSchema = z.enum(["free", "pro", "unlimited"]);
export const trainingCognitiveLevelSchema = z.enum([
  "recognition",
  "understanding",
  "application",
  "analysis",
  "transfer",
  "synthesis",
]);
export const trainingFormatSchema = z.enum([
  "visual-analysis",
  "case-analysis",
  "written-response",
  "conversational-roleplay",
  "guided-builder",
  "diagnosis",
  "decision-simulation",
  "deterministic-practice",
]);
export const trainingModeSchema = z.enum(["analiza", "construye", "practica"]);
export const taxonomySlugSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type TrainingCognitiveLevel = z.infer<
  typeof trainingCognitiveLevelSchema
>;
export type TrainingFormat = z.infer<typeof trainingFormatSchema>;
export type TrainingMode = z.infer<typeof trainingModeSchema>;
export type TrainingPlan = z.infer<typeof trainingPlanSchema>;

export const cognitiveLevelLabels: Record<TrainingCognitiveLevel, string> = {
  recognition: "Reconocimiento",
  understanding: "Comprensión",
  application: "Aplicación",
  analysis: "Análisis",
  transfer: "Transferencia",
  synthesis: "Síntesis",
};

export const trainingFormats = [
  { slug: "visual-analysis", name: "Análisis visual", mode: "analiza" },
  { slug: "case-analysis", name: "Análisis de casos", mode: "analiza" },
  { slug: "diagnosis", name: "Diagnóstico", mode: "analiza" },
  { slug: "written-response", name: "Respuesta escrita", mode: "construye" },
  { slug: "guided-builder", name: "Constructor guiado", mode: "construye" },
  { slug: "conversational-roleplay", name: "Role-play", mode: "practica" },
  { slug: "decision-simulation", name: "Simulación", mode: "practica" },
  { slug: "deterministic-practice", name: "Práctica breve", mode: "practica" },
] as const;

export type TaxonomySkill = {
  slug: string;
  name: string;
  description: string;
  subcategory: string;
  concepts: string[];
};

export type TaxonomyCategory = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  icon: string;
  subcategories: string[];
  skills: TaxonomySkill[];
};

const skill = (
  name: string,
  subcategory: string,
  concepts: string[],
): TaxonomySkill => ({
  slug: name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, ""),
  name,
  subcategory,
  concepts,
  description: `Desarrolla criterio para ${name.toLowerCase()} en situaciones reales.`,
});

export const taxonomyCategories: TaxonomyCategory[] = [
  {
    slug: "marketing-y-marca",
    name: "Marketing y marca",
    shortDescription: "Construye marcas relevantes y mensajes claros.",
    description:
      "Entrena posicionamiento, identidad, contenido, publicidad y experiencia de marca con criterio práctico.",
    icon: "Megaphone",
    subcategories: [
      "Branding",
      "Identidad visual",
      "Posicionamiento",
      "Propuesta de valor",
      "Segmentación",
      "Psicología del consumidor",
      "Publicidad",
      "Contenido",
      "Copywriting",
      "Embudos",
      "Experiencia de marca",
    ],
    skills: [
      skill("Evaluar coherencia de marca", "Branding", [
        "Coherencia visual",
        "Consistencia verbal",
        "Reconocimiento de marca",
      ]),
      skill("Identificar una propuesta de valor débil", "Propuesta de valor", [
        "Relevancia",
        "Diferenciación",
        "Resultado observable",
      ]),
      skill("Analizar jerarquía visual", "Identidad visual", [
        "Contraste",
        "Orden de lectura",
        "Legibilidad",
      ]),
      skill("Escribir titulares claros", "Copywriting", [
        "Promesa",
        "Especificidad",
        "Claridad inmediata",
      ]),
      skill("Diseñar una oferta", "Propuesta de valor", [
        "Valor percibido",
        "Reducción de riesgo",
        "Llamada a la acción",
      ]),
    ],
  },
  {
    slug: "ventas-y-persuasion",
    name: "Ventas y persuasión",
    shortDescription: "Vende con claridad, escucha y ética.",
    description:
      "Practica descubrimiento, presentación de valor, objeciones, negociación, seguimiento y cierre.",
    icon: "BadgeDollarSign",
    subcategories: [
      "Prospección",
      "Descubrimiento de necesidades",
      "Presentación de valor",
      "Manejo de objeciones",
      "Negociación comercial",
      "Seguimiento",
      "Cierre",
      "Ventas escritas",
      "Ventas consultivas",
      "Persuasión ética",
    ],
    skills: [
      skill(
        "Hacer preguntas de descubrimiento",
        "Descubrimiento de necesidades",
        ["Pregunta abierta", "Impacto", "Prioridad"],
      ),
      skill("Responder objeciones", "Manejo de objeciones", [
        "Objeción real",
        "Clarificación",
        "Reencuadre",
      ]),
      skill("Defender precio", "Presentación de valor", [
        "Valor percibido",
        "Coste de inacción",
        "Diferenciación",
      ]),
      skill("Escribir seguimiento", "Seguimiento", [
        "Recapitulación",
        "Próximo paso",
        "Persistencia útil",
      ]),
      skill("Cerrar sin presión", "Cierre", [
        "Señal de compra",
        "Compromiso",
        "Cierre ético",
      ]),
    ],
  },
  {
    slug: "comunicacion-profesional",
    name: "Comunicación profesional",
    shortDescription: "Expresa ideas con claridad e intención.",
    description:
      "Mejora escritura, presentaciones, escucha, storytelling y conversaciones profesionales difíciles.",
    icon: "MessagesSquare",
    subcategories: [
      "Escritura profesional",
      "Comunicación clara",
      "Storytelling",
      "Presentaciones",
      "Mensajería",
      "Conversaciones difíciles",
      "Persuasión",
      "Escucha",
      "Comunicación ejecutiva",
      "Comunicación digital",
    ],
    skills: [
      skill("Escribir con claridad", "Escritura profesional", [
        "Idea principal",
        "Estructura",
        "Economía verbal",
      ]),
      skill("Resumir ideas", "Comunicación clara", [
        "Síntesis",
        "Jerarquía",
        "Contexto mínimo",
      ]),
      skill("Adaptar tono", "Mensajería", ["Intención", "Registro", "Empatía"]),
      skill("Responder mensajes difíciles", "Conversaciones difíciles", [
        "Validación",
        "Límite",
        "Próximo paso",
      ]),
      skill("Presentar una idea", "Presentaciones", [
        "Apertura",
        "Argumento",
        "Cierre",
      ]),
    ],
  },
  {
    slug: "emprendimiento",
    name: "Emprendimiento",
    shortDescription: "Convierte oportunidades en negocios validados.",
    description:
      "Entrena investigación, validación, oferta, modelo de negocio, canales, precios y operaciones iniciales.",
    icon: "Rocket",
    subcategories: [
      "Detección de oportunidades",
      "Validación",
      "Investigación de clientes",
      "Modelo de negocio",
      "Producto mínimo viable",
      "Oferta",
      "Precios",
      "Canales",
      "Crecimiento",
      "Operaciones iniciales",
    ],
    skills: [
      skill("Evaluar una oportunidad", "Detección de oportunidades", [
        "Problema",
        "Cliente",
        "Ventana de oportunidad",
      ]),
      skill("Diseñar una hipótesis", "Validación", [
        "Supuesto",
        "Métrica",
        "Umbral",
      ]),
      skill("Crear entrevistas", "Investigación de clientes", [
        "Pregunta neutral",
        "Conducta pasada",
        "Señal de demanda",
      ]),
      skill("Elegir un MVP", "Producto mínimo viable", [
        "Hipótesis central",
        "Prototipo",
        "Aprendizaje",
      ]),
      skill("Validar una oferta", "Oferta", [
        "Promesa",
        "Compromiso",
        "Evidencia comercial",
      ]),
    ],
  },
  {
    slug: "estrategia-y-toma-de-decisiones",
    name: "Estrategia y toma de decisiones",
    shortDescription: "Decide mejor bajo restricciones reales.",
    description:
      "Desarrolla priorización, análisis competitivo, resolución de problemas, métricas y ejecución estratégica.",
    icon: "GitBranch",
    subcategories: [
      "Priorización",
      "Pensamiento estratégico",
      "Análisis competitivo",
      "Posicionamiento estratégico",
      "Modelos mentales",
      "Resolución de problemas",
      "Riesgo",
      "Decisiones bajo incertidumbre",
      "Métricas",
      "Ejecución",
    ],
    skills: [
      skill("Priorizar", "Priorización", [
        "Impacto",
        "Costo de oportunidad",
        "Secuencia",
      ]),
      skill("Identificar causa raíz", "Resolución de problemas", [
        "Síntoma",
        "Causa",
        "Evidencia",
      ]),
      skill("Evaluar riesgos", "Riesgo", [
        "Probabilidad",
        "Impacto",
        "Mitigación",
      ]),
      skill("Comparar alternativas", "Decisiones bajo incertidumbre", [
        "Criterio",
        "Escenario",
        "Reversibilidad",
      ]),
      skill("Interpretar métricas", "Métricas", [
        "Señal",
        "Tendencia",
        "Decisión",
      ]),
    ],
  },
  {
    slug: "liderazgo-y-gestion-de-equipos",
    name: "Liderazgo y gestión de equipos",
    shortDescription: "Lidera conversaciones, decisiones y desempeño.",
    description:
      "Practica delegación, feedback, motivación, reuniones, conflictos, cultura y contratación.",
    icon: "Users",
    subcategories: [
      "Delegación",
      "Feedback",
      "Motivación",
      "Cultura",
      "Reuniones",
      "Conflictos",
      "Desempeño",
      "Comunicación de liderazgo",
      "Toma de decisiones",
      "Contratación",
    ],
    skills: [
      skill("Dar feedback", "Feedback", ["Observación", "Impacto", "Acuerdo"]),
      skill("Delegar", "Delegación", ["Resultado", "Autoridad", "Seguimiento"]),
      skill("Resolver conflictos", "Conflictos", [
        "Interés",
        "Tensión",
        "Acuerdo",
      ]),
      skill("Comunicar expectativas", "Desempeño", [
        "Estándar",
        "Evidencia",
        "Responsabilidad",
      ]),
      skill("Liderar reuniones", "Reuniones", [
        "Objetivo",
        "Agenda",
        "Compromiso",
      ]),
    ],
  },
  {
    slug: "finanzas-y-criterio-economico",
    name: "Finanzas y criterio económico",
    shortDescription: "Comprende números para decidir con criterio.",
    description:
      "Entrena flujo de caja, costos, márgenes, presupuestos, inversión, riesgo y rentabilidad.",
    icon: "ChartNoAxesCombined",
    subcategories: [
      "Finanzas personales",
      "Flujo de caja",
      "Costos",
      "Márgenes",
      "Presupuestos",
      "Precios",
      "Inversión",
      "Riesgo financiero",
      "Rentabilidad",
      "Métricas financieras",
    ],
    skills: [
      skill("Interpretar flujo de caja", "Flujo de caja", [
        "Entradas",
        "Salidas",
        "Ciclo de caja",
      ]),
      skill("Calcular margen", "Márgenes", [
        "Ingreso",
        "Costo variable",
        "Contribución",
      ]),
      skill("Evaluar rentabilidad", "Rentabilidad", [
        "Retorno",
        "Capital",
        "Horizonte",
      ]),
      skill("Priorizar gastos", "Presupuestos", [
        "Gasto esencial",
        "Inversión",
        "Recorte",
      ]),
      skill("Analizar precios", "Precios", [
        "Referencia",
        "Elasticidad",
        "Unidad económica",
      ]),
    ],
  },
  {
    slug: "productividad-y-desarrollo-personal-aplicado",
    name: "Productividad y desarrollo personal aplicado",
    shortDescription: "Crea sistemas personales que sí se sostienen.",
    description:
      "Convierte objetivos en hábitos, enfoque, energía, aprendizaje y ejecución consistente.",
    icon: "CalendarCheck",
    subcategories: [
      "Hábitos",
      "Disciplina",
      "Enfoque",
      "Gestión del tiempo",
      "Sistemas",
      "Energía",
      "Aprendizaje",
      "Toma de decisiones personal",
      "Autoconocimiento",
      "Ejecución",
    ],
    skills: [
      skill("Diseñar hábitos", "Hábitos", [
        "Señal",
        "Respuesta mínima",
        "Recompensa",
      ]),
      skill("Reducir fricción", "Sistemas", [
        "Fricción",
        "Entorno",
        "Automatización",
      ]),
      skill("Priorizar tareas", "Gestión del tiempo", [
        "Impacto",
        "Urgencia",
        "Trabajo activo",
      ]),
      skill("Crear sistemas", "Sistemas", ["Proceso", "Indicador", "Revisión"]),
      skill("Mantener enfoque", "Enfoque", [
        "Bloque",
        "Distracción",
        "Retorno",
      ]),
    ],
  },
];

export type LearningPath = {
  slug: string;
  name: string;
  promise: string;
  categorySlug: string;
  minutes: number;
  difficulty: "Inicial" | "Intermedio" | "Avanzado";
  minimumPlan: TrainingPlan;
  modules: string[];
};

export const learningPaths: LearningPath[] = [
  {
    slug: "aprende-a-vender",
    name: "Aprende a vender",
    promise: "Conduce una conversación comercial con claridad y sin presión.",
    categorySlug: "ventas-y-persuasion",
    minutes: 55,
    difficulty: "Inicial",
    minimumPlan: "free",
    modules: ["Descubre", "Presenta valor", "Responde y acuerda"],
  },
  {
    slug: "construye-una-marca-fuerte",
    name: "Construye una marca fuerte",
    promise: "Convierte una propuesta en una identidad coherente.",
    categorySlug: "marketing-y-marca",
    minutes: 60,
    difficulty: "Intermedio",
    minimumPlan: "free",
    modules: ["Define", "Alinea", "Evalúa"],
  },
  {
    slug: "lanza-tu-primera-idea",
    name: "Lanza tu primera idea",
    promise: "Valida una oportunidad antes de invertir de más.",
    categorySlug: "emprendimiento",
    minutes: 65,
    difficulty: "Inicial",
    minimumPlan: "free",
    modules: ["Investiga", "Prueba", "Decide"],
  },
  {
    slug: "habla-y-escribe-con-claridad",
    name: "Habla y escribe con claridad",
    promise: "Expresa decisiones e ideas para que otros actúen.",
    categorySlug: "comunicacion-profesional",
    minutes: 50,
    difficulty: "Inicial",
    minimumPlan: "free",
    modules: ["Ordena", "Adapta", "Comunica"],
  },
  {
    slug: "lidera-mejores-conversaciones",
    name: "Lidera mejores conversaciones",
    promise: "Da feedback, delega y resuelve tensiones.",
    categorySlug: "liderazgo-y-gestion-de-equipos",
    minutes: 70,
    difficulty: "Intermedio",
    minimumPlan: "pro",
    modules: ["Prepara", "Conversa", "Da seguimiento"],
  },
  {
    slug: "mejora-tu-criterio-de-negocio",
    name: "Mejora tu criterio de negocio",
    promise: "Compara opciones y decide con mejores preguntas.",
    categorySlug: "estrategia-y-toma-de-decisiones",
    minutes: 65,
    difficulty: "Intermedio",
    minimumPlan: "free",
    modules: ["Diagnostica", "Compara", "Decide"],
  },
  {
    slug: "domina-tus-finanzas-empresariales",
    name: "Domina tus finanzas empresariales",
    promise: "Lee los números esenciales antes de decidir.",
    categorySlug: "finanzas-y-criterio-economico",
    minutes: 70,
    difficulty: "Intermedio",
    minimumPlan: "pro",
    modules: ["Comprende", "Calcula", "Decide"],
  },
  {
    slug: "crea-sistemas-para-ejecutar-mejor",
    name: "Crea sistemas para ejecutar mejor",
    promise: "Convierte objetivos en procesos sostenibles.",
    categorySlug: "productividad-y-desarrollo-personal-aplicado",
    minutes: 50,
    difficulty: "Inicial",
    minimumPlan: "free",
    modules: ["Diseña", "Protege", "Revisa"],
  },
];

export function findCategory(slug: string) {
  return taxonomyCategories.find((category) => category.slug === slug);
}

export function findSkill(slug: string) {
  for (const category of taxonomyCategories) {
    const found = category.skills.find((item) => item.slug === slug);
    if (found) return { ...found, category };
  }
  return undefined;
}

export function findLearningPath(slug: string) {
  return learningPaths.find((path) => path.slug === slug);
}

export function searchTrainingCatalog(query: string) {
  const normalized = query.trim().toLocaleLowerCase("es");
  if (normalized.length < 2) return [];
  const categories = taxonomyCategories.flatMap((category) => [
    ...(category.name.toLocaleLowerCase("es").includes(normalized)
      ? [
          {
            type: "category" as const,
            slug: category.slug,
            title: category.name,
            description: category.shortDescription,
          },
        ]
      : []),
    ...category.skills
      .filter((item) =>
        `${item.name} ${item.concepts.join(" ")}`
          .toLocaleLowerCase("es")
          .includes(normalized),
      )
      .map((item) => ({
        type: "skill" as const,
        slug: item.slug,
        title: item.name,
        description: category.name,
      })),
  ]);
  const paths = learningPaths
    .filter((path) =>
      `${path.name} ${path.promise}`
        .toLocaleLowerCase("es")
        .includes(normalized),
    )
    .map((path) => ({
      type: "path" as const,
      slug: path.slug,
      title: path.name,
      description: path.promise,
    }));
  return [...categories, ...paths].slice(0, 20);
}
