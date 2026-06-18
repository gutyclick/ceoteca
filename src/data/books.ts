import type { Book, BookCategory } from "@/types";

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
