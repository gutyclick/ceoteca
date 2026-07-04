export const siteConfig = {
  name: "Ceoteca",
  tagline: "Aprende ideas clave y conviértelas en acción.",
  description:
    "Ceoteca reúne análisis editoriales propios, ejercicios prácticos y recomendaciones para complementar tus lecturas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "soporte@ceoteca.com",
  productMetrics: {
    learningPaths: "400+",
    categories: "15+",
    formats: "50K+",
    focus: "4.9/5",
  },
} as const;
