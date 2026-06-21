export const siteConfig = {
  name: "Ceoteca",
  tagline: "Aprende las mejores ideas del mundo en 15 minutos.",
  description:
    "Ceoteca transforma libros de finanzas, hábitos, productividad, emprendimiento y desarrollo personal en experiencias de aprendizaje interactivas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "soporte@ceoteca.com",
  productMetrics: {
    learningMinutes: "15",
    categories: "7",
    formats: "3",
    focus: "100%",
  },
} as const;
