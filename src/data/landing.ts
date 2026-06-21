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
    subtitle: "Ingresos y riqueza",
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
    subtitle: "Foco",
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
    title: "Estrategia",
    subtitle: "Empresarial",
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
  { label: "Ideas clave", icon: Sparkles },
  { label: "Contexto", icon: Clock3 },
  { label: "Ejercicios", icon: CheckCircle2 },
  { label: "Chat IA", icon: Bot },
] as const;

export const chatBenefits = [
  "Respuestas basadas en contenido editorial propio",
  "Recomendaciones según tus objetivos",
  "Aplicación práctica para complementar tu lectura",
] as const;

export const chatSteps = [
  "Define el objetivo que quieres mejorar: dinero, foco, liderazgo, comunicación o negocio.",
  "Recibe una ruta breve con ideas del catálogo que conectan con esa meta.",
  "Convierte una idea en un ejercicio concreto para aplicar hoy.",
] as const;

export const productStats = [
  {
    label: "Rutas accionables",
    value: siteConfig.productMetrics.learningPaths,
    icon: LibraryBig,
    accent: "text-brand-purple",
    background: "bg-brand-purple/15",
  },
  {
    label: "Categorías clave",
    value: siteConfig.productMetrics.categories,
    icon: Users,
    accent: "text-success",
    background: "bg-success/15",
  },
  {
    label: "Formatos de aprendizaje",
    value: siteConfig.productMetrics.formats,
    icon: Clock3,
    accent: "text-warning",
    background: "bg-warning/15",
  },
  {
    label: "Contenido editorial",
    value: siteConfig.productMetrics.focus,
    icon: Sparkles,
    accent: "text-brand-pink",
    background: "bg-brand-pink/15",
  },
] as const;

export const heroActions = {
  primary: {
    href: "/registro",
    label: "Empieza gratis",
    icon: Play,
  },
  secondary: {
    href: "/biblioteca",
    label: "Explorar biblioteca",
    icon: BookOpen,
  },
} as const;

export const aiQuestion = {
  icon: MessageCircle,
  text: "Quiero mejorar mi enfoque y organizar mejor mi semana. ¿Qué libros debería explorar y cómo puedo aplicar sus ideas?",
} as const;

export const howItWorksSteps = [
  {
    title: "Elige un libro",
    description:
      "Explora análisis editoriales en español sobre emprendimiento, ventas, finanzas, inversiones, liderazgo, productividad, comunicación y desarrollo personal.",
    icon: Compass,
  },
  {
    title: "Aprende ideas clave",
    description:
      "Revisa contexto, puntos centrales y ejercicios diseñados para complementar tu lectura.",
    icon: Zap,
  },
  {
    title: "Aplica con intención",
    description:
      "Usa la IA para encontrar conexiones, preparar próximos pasos y convertir ideas en acción.",
    icon: Target,
  },
] as const;

export const previewBooks = [
  {
    title: "Hábitos Atómicos",
    author: "James Clear",
    category: "Desarrollo personal",
    duration: "Guía breve",
    accent: "from-brand-blue via-brand-purple to-brand-pink",
    pattern: "orb",
  },
  {
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    category: "Finanzas personales",
    duration: "Ideas clave",
    accent: "from-emerald-300 to-cyan-300",
    pattern: "steps",
  },
  {
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    category: "Emprendimiento",
    duration: "Aplicación",
    accent: "from-orange-300 to-rose-400",
    pattern: "growth",
  },
] as const;

export const comparisonRows = [
  {
    feature: "Aprendizaje guiado",
    ceoteca: "Análisis editorial accionable",
    traditional: "Lectura completa sin guía",
  },
  {
    feature: "Aplicación práctica",
    ceoteca: "Ejercicios y seguimiento de progreso",
    traditional: "Depende del lector",
  },
  {
    feature: "Preguntas al contenido",
    ceoteca: "IA limitada al contenido autorizado",
    traditional: "Notas manuales",
  },
  {
    feature: "Audio",
    ceoteca: "Audio editorial según plan",
    traditional: "No siempre incluido",
  },
] as const;

export const audienceCards = [
  {
    name: "Emprendedores",
    role: "Emprendimiento y ventas",
    quote:
      "Encuentran ideas de libros de negocio y las convierten en acciones simples para vender, decidir y construir con más claridad.",
  },
  {
    name: "Profesionales",
    role: "Productividad y finanzas personales",
    quote:
      "Usan Ceoteca para aprender con foco, comparar ideas y aplicar sistemas de productividad, dinero y liderazgo.",
  },
  {
    name: "Lectores curiosos",
    role: "Crecimiento personal",
    quote:
      "Descubren qué libros profundizar después y construyen el hábito de aprender con más intención.",
  },
] as const;

export const landingFaqs = [
  {
    question: "¿Cómo se relaciona Ceoteca con los libros completos?",
    answer:
      "Ceoteca complementa tus lecturas con análisis editoriales propios, ejercicios y contexto práctico para decidir qué obras quieres profundizar después.",
  },
  {
    question: "¿El contenido usa textos copiados de los libros?",
    answer:
      "No. Los análisis son textos propios de Ceoteca. No reproducimos capítulos, portadas oficiales ni citas inventadas.",
  },
  {
    question: "¿Qué puede hacer la IA de Ceoteca?",
    answer:
      "Puede recomendar libros del catálogo, conectar ideas entre temas, ayudarte a aplicar un concepto, sugerir ejercicios y responder dentro del contexto autorizado de cada análisis.",
  },
  {
    question: "¿Puedo empezar gratis?",
    answer:
      "Sí. Puedes crear una cuenta gratis para explorar Ceoteca. Los planes superiores desbloquean más acceso, audio, actividades avanzadas y chat contextual según disponibilidad.",
  },
] as const;

export const finalCta = {
  eyebrow: "Tu biblioteca accionable",
  title: "Convierte ideas en acción.",
  description:
    "Complementa tus lecturas con contexto editorial, ejercicios prácticos y recomendaciones para decidir qué profundizar después.",
  primary: {
    href: "/registro",
    label: "Crear cuenta gratis",
    icon: Rocket,
  },
  secondary: {
    href: "/biblioteca",
    label: "Ver biblioteca",
    icon: LibraryBig,
  },
} as const;
