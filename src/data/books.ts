import type { Book, BookCategory } from "@/types";

const defaultAnalysis = [
  {
    title: "Idea central",
    content:
      "Este análisis demo resume una interpretación editorial propia: el valor del libro está en convertir una idea amplia en decisiones pequeñas que el lector pueda probar esta semana.",
  },
  {
    title: "Aplicación práctica",
    content:
      "La experiencia propone detectar un área concreta, elegir una acción mínima y medir si esa acción reduce fricción o mejora claridad. No busca prometer resultados, sino crear un punto de partida.",
  },
  {
    title: "Limitación útil",
    content:
      "Ninguna idea funciona igual para todas las personas. El lector debe adaptar el enfoque a su contexto, energía, responsabilidades y recursos disponibles.",
  },
];

const defaultKeyPoints = [
  {
    number: 1,
    title: "Reduce la fricción",
    explanation:
      "Una acción sencilla tiene más probabilidad de repetirse que un plan perfecto pero pesado.",
    example:
      "Preparar el entorno la noche anterior puede hacer más fácil estudiar, ahorrar o entrenar.",
    action: "Elige una acción de menos de cinco minutos para comenzar hoy.",
    limitation:
      "Lo pequeño no reemplaza una estrategia completa; solo ayuda a iniciar con menos resistencia.",
  },
  {
    number: 2,
    title: "Mide lo que importa",
    explanation:
      "El progreso se vuelve visible cuando se registra una señal concreta y fácil de revisar.",
    example:
      "Marcar tres sesiones completadas puede ser más útil que esperar motivación perfecta.",
    action: "Define una métrica simple para los próximos siete días.",
    limitation:
      "Medir demasiado puede distraer; conviene elegir una sola señal principal.",
  },
  {
    number: 3,
    title: "Adapta antes de abandonar",
    explanation:
      "Cuando una práctica falla, puede necesitar ajuste de contexto, horario o dificultad.",
    example:
      "Si leer de noche no funciona, prueba diez minutos después del almuerzo.",
    action: "Cambia una variable antes de descartar el hábito o sistema.",
    limitation:
      "Algunas metas requieren apoyo externo o condiciones que no dependen solo del usuario.",
  },
];

const defaultActivities = [
  {
    title: "Pregunta de reflexión",
    prompt:
      "¿Qué acción pequeña te acercaría a este aprendizaje sin depender de motivación alta?",
    type: "reflection" as const,
  },
  {
    title: "Checklist de inicio",
    prompt: "Marca tres condiciones que puedes preparar antes de empezar.",
    type: "checklist" as const,
    options: [
      "Lugar definido",
      "Recordatorio visible",
      "Tiempo bloqueado",
      "Meta reducida",
    ],
  },
  {
    title: "Escenario práctico",
    prompt:
      "Imagina que solo tienes 12 minutos al día. ¿Qué parte del aprendizaje conservarías y qué eliminarías?",
    type: "scenario" as const,
  },
];

export const bookCategories: Array<"Todos" | BookCategory> = [
  "Todos",
  "Finanzas",
  "Hábitos",
  "Productividad",
  "Emprendimiento",
  "Psicología",
  "Liderazgo",
];

export const demoBooks: Book[] = [
  {
    id: "habitos-atomicos",
    slug: "habitos-atomicos",
    title: "Hábitos Atómicos",
    author: "James Clear",
    category: "Hábitos",
    description:
      "Un análisis editorial demo sobre cómo diseñar sistemas simples para sostener pequeñas mejoras diarias.",
    readingTime: 12,
    difficulty: "Inicial",
    tags: ["hábitos", "disciplina", "sistemas"],
    cover: {
      variant: "orb",
      gradient: "from-brand-blue via-brand-purple to-brand-pink",
      accent: "text-brand-pink",
    },
    isFeatured: true,
    isPublished: true,
    isDemoContent: true,
    progress: 38,
    purchaseUrl: "https://www.google.com/search?q=Habitos+Atomicos+James+Clear",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: el aprendizaje más útil no es acumular ideas, sino diseñar una acción pequeña que pueda repetirse hasta volverse parte del entorno.",
  },
  {
    id: "padre-rico-padre-pobre",
    slug: "padre-rico-padre-pobre",
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    category: "Finanzas",
    description:
      "Ideas demo sobre mentalidad financiera, activos, pasivos y decisiones de dinero más conscientes.",
    readingTime: 14,
    difficulty: "Inicial",
    tags: ["finanzas", "dinero", "activos"],
    cover: {
      variant: "steps",
      gradient: "from-emerald-300 to-cyan-400",
      accent: "text-emerald-200",
    },
    isPublished: true,
    isDemoContent: true,
    progress: 68,
    purchaseUrl:
      "https://www.google.com/search?q=Padre+Rico+Padre+Pobre+Robert+Kiyosaki",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: pensar mejor sobre dinero empieza por distinguir entre consumo inmediato, activos posibles y hábitos de decisión más conscientes.",
  },
  {
    id: "startup-100",
    slug: "startup-100",
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    category: "Emprendimiento",
    description:
      "Una lectura demo sobre validar ofertas pequeñas, vender pronto y construir negocios livianos.",
    readingTime: 11,
    difficulty: "Inicial",
    tags: ["negocios", "ventas", "validación"],
    cover: {
      variant: "growth",
      gradient: "from-orange-300 to-rose-400",
      accent: "text-orange-200",
    },
    isPublished: true,
    isDemoContent: true,
    progress: 0,
    purchaseUrl: "https://www.google.com/search?q=La+Startup+de+100+Chris+Guillebeau",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: una idea de negocio gana claridad cuando se convierte rápido en oferta, conversación con clientes y aprendizaje medible.",
  },
  {
    id: "hombre-rico-babilonia",
    slug: "hombre-rico-babilonia",
    title: "El Hombre Más Rico de Babilonia",
    author: "George S. Clason",
    category: "Finanzas",
    description:
      "Principios demo de ahorro, disciplina y construcción gradual de patrimonio personal.",
    readingTime: 10,
    difficulty: "Inicial",
    tags: ["ahorro", "patrimonio", "finanzas"],
    cover: {
      variant: "steps",
      gradient: "from-amber-300 to-yellow-500",
      accent: "text-yellow-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl:
      "https://www.google.com/search?q=El+Hombre+Mas+Rico+de+Babilonia",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: la estabilidad financiera suele comenzar con reglas simples, repetidas con paciencia y revisadas con honestidad.",
  },
  {
    id: "pensar-rapido-pensar-despacio",
    slug: "pensar-rapido-pensar-despacio",
    title: "Pensar Rápido, Pensar Despacio",
    author: "Daniel Kahneman",
    category: "Psicología",
    description:
      "Un mapa demo para reconocer sesgos, intuición y decisiones que merecen más pausa.",
    readingTime: 15,
    difficulty: "Avanzado",
    tags: ["decisiones", "sesgos", "mente"],
    cover: {
      variant: "grid",
      gradient: "from-indigo-300 to-violet-500",
      accent: "text-indigo-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl:
      "https://www.google.com/search?q=Pensar+Rapido+Pensar+Despacio+Daniel+Kahneman",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: tomar mejores decisiones exige reconocer cuándo la intuición ayuda y cuándo conviene detenerse a revisar supuestos.",
  },
  {
    id: "poder-del-ahora",
    slug: "poder-del-ahora",
    title: "El Poder del Ahora",
    author: "Eckhart Tolle",
    category: "Psicología",
    description:
      "Reflexiones demo sobre presencia, atención y reducción de ruido mental en la vida diaria.",
    readingTime: 13,
    difficulty: "Intermedio",
    tags: ["presencia", "atención", "calma"],
    cover: {
      variant: "orb",
      gradient: "from-sky-300 to-blue-500",
      accent: "text-sky-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl: "https://www.google.com/search?q=El+Poder+del+Ahora+Eckhart+Tolle",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: practicar presencia no elimina los problemas, pero puede cambiar la relación que tenemos con ellos.",
  },
  {
    id: "como-ganar-amigos",
    slug: "como-ganar-amigos",
    title: "Cómo Ganar Amigos e Influir Sobre las Personas",
    author: "Dale Carnegie",
    category: "Liderazgo",
    description:
      "Ideas demo sobre escucha, empatía y relaciones profesionales más cuidadosas.",
    readingTime: 12,
    difficulty: "Inicial",
    tags: ["comunicación", "relaciones", "influencia"],
    cover: {
      variant: "people",
      gradient: "from-cyan-300 to-blue-600",
      accent: "text-cyan-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl:
      "https://www.google.com/search?q=Como+Ganar+Amigos+e+Influir+Sobre+las+Personas",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: las relaciones mejoran cuando la atención deja de estar solo en convencer y empieza a incluir escucha real.",
  },
  {
    id: "semana-laboral-4-horas",
    slug: "semana-laboral-4-horas",
    title: "La Semana Laboral de 4 Horas",
    author: "Tim Ferriss",
    category: "Productividad",
    description:
      "Un análisis demo sobre foco, delegación, automatización y diseño de tiempo.",
    readingTime: 13,
    difficulty: "Intermedio",
    tags: ["tiempo", "foco", "automatización"],
    cover: {
      variant: "bolt",
      gradient: "from-violet-300 to-fuchsia-500",
      accent: "text-fuchsia-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl:
      "https://www.google.com/search?q=La+Semana+Laboral+de+4+Horas+Tim+Ferriss",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: optimizar el tiempo exige elegir qué eliminar, qué delegar y qué merece atención profunda.",
  },
  {
    id: "mindset",
    slug: "mindset",
    title: "Mindset",
    author: "Carol S. Dweck",
    category: "Productividad",
    description:
      "Contenido demo sobre mentalidad de crecimiento, aprendizaje y respuesta al error.",
    readingTime: 11,
    difficulty: "Inicial",
    tags: ["aprendizaje", "mentalidad", "crecimiento"],
    cover: {
      variant: "growth",
      gradient: "from-lime-300 to-emerald-500",
      accent: "text-lime-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl: "https://www.google.com/search?q=Mindset+Carol+Dweck",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: una mentalidad de aprendizaje se nota menos en lo que decimos creer y más en cómo respondemos al error.",
  },
  {
    id: "inversor-inteligente",
    slug: "inversor-inteligente",
    title: "El Inversor Inteligente",
    author: "Benjamin Graham",
    category: "Finanzas",
    description:
      "Una vista demo sobre prudencia, margen de seguridad y disciplina al invertir.",
    readingTime: 15,
    difficulty: "Avanzado",
    tags: ["inversión", "riesgo", "valor"],
    cover: {
      variant: "grid",
      gradient: "from-slate-300 to-emerald-500",
      accent: "text-emerald-200",
    },
    isPublished: true,
    isDemoContent: true,
    purchaseUrl:
      "https://www.google.com/search?q=El+Inversor+Inteligente+Benjamin+Graham",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial demo: invertir con prudencia requiere reglas, margen de seguridad y una relación madura con la incertidumbre.",
  },
];

export function filterBooks(
  books: Book[],
  query: string,
  category: "Todos" | BookCategory,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return books.filter((book) => {
    const matchesCategory = category === "Todos" || book.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [book.title, book.author, book.category, ...book.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export function getBooksByCategory(category: BookCategory) {
  return demoBooks.filter((book) => book.category === category);
}

export function getBookBySlug(slug: string) {
  return demoBooks.find((book) => book.slug === slug) ?? null;
}
