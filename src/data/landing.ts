import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  Compass,
  LibraryBig,
  MessageCircle,
  Play,
  Rocket,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { siteConfig } from "@/config/site";

export const heroBadgeAvatars = ["M", "A", "J", "C"] as const;

export const visualCards = [
  {
    title: "Riqueza",
    subtitle: "Finanzas",
    icon: BarChart3,
    accent: "from-emerald-300 to-cyan-300",
    border: "border-cyan-200/50",
    glow: "shadow-[0_0_52px_rgba(45,212,191,0.18)]",
    rotate: "-rotate-[8deg]",
    offset: "lg:translate-y-16",
    featured: false,
  },
  {
    title: "Productividad",
    subtitle: "Hábitos",
    icon: Zap,
    accent: "from-violet-300 to-fuchsia-300",
    border: "border-violet-300/60",
    glow: "shadow-[0_0_58px_rgba(139,92,246,0.2)]",
    rotate: "-rotate-[5deg]",
    offset: "lg:translate-y-8",
    featured: false,
  },
  {
    title: "Hábitos Atómicos",
    subtitle: "James Clear",
    icon: Brain,
    accent: "from-brand-blue via-brand-purple to-brand-pink",
    border: "border-brand-purple/80",
    glow: "shadow-[0_0_92px_rgba(168,85,247,0.28)]",
    rotate: "rotate-0",
    offset: "",
    featured: true,
  },
  {
    title: "Negocios",
    subtitle: "Estrategia",
    icon: BarChart3,
    accent: "from-rose-300 to-orange-300",
    border: "border-rose-300/60",
    glow: "shadow-[0_0_58px_rgba(244,63,94,0.18)]",
    rotate: "rotate-[5deg]",
    offset: "lg:translate-y-8",
    featured: false,
  },
  {
    title: "Liderazgo",
    subtitle: "Personas",
    icon: Users,
    accent: "from-sky-300 to-blue-400",
    border: "border-sky-300/60",
    glow: "shadow-[0_0_58px_rgba(56,189,248,0.18)]",
    rotate: "rotate-[8deg]",
    offset: "lg:translate-y-16",
    featured: false,
  },
] as const;

export const featuredBookFacts = [
  { label: "12 min", icon: Clock3 },
  { label: "5 ideas clave", icon: Sparkles },
  { label: "3 ejercicios", icon: CheckCircle2 },
  { label: "IA incluida", icon: Bot },
] as const;

export const chatBenefits = [
  "Respuestas basadas en el análisis",
  "Adaptadas a tu contexto",
  "Disponible en modo demo",
] as const;

export const chatSteps = [
  "Empieza con hábitos de 2 minutos que puedas sostener incluso en días ocupados.",
  "Usa el entorno a tu favor: deja recordatorios visuales en lugares frecuentes.",
  "Aplica la regla del 1%: mejora mínima diaria, gran cambio a largo plazo.",
] as const;

export const demoStats = [
  {
    label: "Libros analizados",
    value: siteConfig.demoMetrics.booksAnalyzed,
    icon: LibraryBig,
    accent: "text-brand-purple",
    background: "bg-brand-purple/15",
  },
  {
    label: "Lectores activos",
    value: siteConfig.demoMetrics.activeReaders,
    icon: Users,
    accent: "text-success",
    background: "bg-success/15",
  },
  {
    label: "Lectura promedio",
    value: `${siteConfig.demoMetrics.averageReadMinutes} min`,
    icon: Clock3,
    accent: "text-warning",
    background: "bg-warning/15",
  },
  {
    label: "Valoración de usuarios",
    value: siteConfig.demoMetrics.rating,
    icon: Sparkles,
    accent: "text-brand-pink",
    background: "bg-brand-pink/15",
  },
] as const;

export const heroActions = {
  primary: {
    href: "/registro",
    label: "Empieza gratis, sin tarjeta",
    icon: Play,
  },
  secondary: {
    href: "/biblioteca",
    label: "Explorar biblioteca",
    icon: BookOpen,
  },
} as const;

export const demoQuestion = {
  icon: MessageCircle,
  text: "¿Cómo puedo aplicar hábitos atómicos si vivo en Panamá y tengo poco tiempo?",
} as const;

export const howItWorksSteps = [
  {
    title: "Elige un libro",
    description:
      "Explora una biblioteca editorial en español organizada por temas, duración y nivel.",
    icon: Compass,
  },
  {
    title: "Aprende en 15 minutos",
    description:
      "Lee ideas originales, puntos clave y ejercicios breves diseñados para recordar y aplicar.",
    icon: Zap,
  },
  {
    title: "Pregunta y aterriza",
    description:
      "Usa el chat contextual para convertir el análisis en próximos pasos concretos.",
    icon: Target,
  },
] as const;

export const previewBooks = [
  {
    title: "Hábitos Atómicos",
    author: "James Clear",
    category: "Hábitos",
    duration: "12 min",
    accent: "from-brand-blue via-brand-purple to-brand-pink",
    pattern: "orb",
  },
  {
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    category: "Finanzas",
    duration: "14 min",
    accent: "from-emerald-300 to-cyan-300",
    pattern: "steps",
  },
  {
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    category: "Emprendimiento",
    duration: "11 min",
    accent: "from-orange-300 to-rose-400",
    pattern: "growth",
  },
] as const;

export const comparisonRows = [
  {
    feature: "Lectura guiada de 15 minutos",
    ceoteca: "Experiencia interactiva",
    traditional: "Lectura completa sin guía",
  },
  {
    feature: "Aplicación práctica",
    ceoteca: "Ejercicios y próximos pasos",
    traditional: "Depende del lector",
  },
  {
    feature: "Preguntas al contenido",
    ceoteca: "Chat contextual por libro",
    traditional: "Notas manuales",
  },
  {
    feature: "Audio",
    ceoteca: "Disponible según plan",
    traditional: "No siempre incluido",
  },
] as const;

export const demoTestimonials = [
  {
    name: "María Fernanda",
    role: "Emprendedora",
    quote:
      "Me ayuda a convertir ideas grandes en acciones pequeñas sin sentir que tengo que terminar un libro entero primero.",
  },
  {
    name: "Andrés López",
    role: "Profesional de finanzas",
    quote:
      "La mezcla de resumen editorial, ejercicios y preguntas hace que el aprendizaje se sienta mucho más útil.",
  },
  {
    name: "Camila Torres",
    role: "Estudiante",
    quote:
      "Uso Ceoteca como punto de partida para decidir qué libros quiero leer completos después.",
  },
] as const;

export const landingFaqs = [
  {
    question: "¿Ceoteca reemplaza leer el libro completo?",
    answer:
      "No. Ceoteca ofrece análisis educativos y editoriales propios para entender ideas principales y decidir cómo aplicarlas.",
  },
  {
    question: "¿El contenido usa textos copiados de los libros?",
    answer:
      "No. El contenido demo y futuro debe ser original, sin capítulos reproducidos, portadas oficiales ni citas inventadas.",
  },
  {
    question: "¿Puedo usarlo sin conectar Supabase u OpenAI?",
    answer:
      "Sí. El MVP está preparado para funcionar en modo demo sin credenciales externas.",
  },
  {
    question: "¿Qué pasa con pagos?",
    answer:
      "La integración de pagos permanece deshabilitada hasta definir un proveedor real.",
  },
] as const;

export const finalCta = {
  eyebrow: "Tu biblioteca accionable",
  title: "Convierte curiosidad en aprendizaje constante.",
  description:
    "Empieza gratis, explora los primeros análisis y construye el hábito de aprender con claridad.",
  primary: {
    href: "/registro",
    label: "Crear cuenta gratis",
    icon: Rocket,
  },
  secondary: {
    href: "/biblioteca",
    label: "Ver libros demo",
    icon: LibraryBig,
  },
} as const;
