export const siteConfig = {
  name: "Ceoteca",
  tagline: "Aprende las mejores ideas del mundo en 15 minutos.",
  description:
    "Ceoteca transforma libros de finanzas, habitos, productividad, emprendimiento y desarrollo personal en experiencias de aprendizaje interactivas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "soporte@ceoteca.com",
  demoMetrics: {
    booksAnalyzed: "+500",
    activeReaders: "+25,000",
    averageReadMinutes: "12",
    rating: "4.9/5",
    isDemoContent: true,
  },
} as const;
