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
    subtitle: "Habitos",
    icon: Zap,
    accent: "from-violet-300 to-fuchsia-300",
    border: "border-violet-300/60",
    glow: "shadow-[0_0_58px_rgba(139,92,246,0.2)]",
    rotate: "-rotate-[5deg]",
    offset: "lg:translate-y-8",
    featured: false,
  },
  {
    title: "Habitos Atomicos",
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
  { label: "15 min", icon: Clock3 },
  { label: "Ideas clave", icon: Sparkles },
  { label: "Ejercicios", icon: CheckCircle2 },
  { label: "Chat IA", icon: Bot },
] as const;

export const chatBenefits = [
  "Respuestas basadas en contenido editorial propio",
  "Recomendaciones segun tus objetivos",
  "Aplicacion practica sin salir del libro",
] as const;

export const chatSteps = [
  "Define el objetivo que quieres mejorar: dinero, foco, liderazgo, habitos o negocio.",
  "Recibe una ruta breve con ideas del catalogo que conectan con esa meta.",
  "Convierte la lectura en un ejercicio concreto para aplicar hoy.",
] as const;

export const productStats = [
  {
    label: "Minutos por experiencia",
    value: siteConfig.productMetrics.learningMinutes,
    icon: LibraryBig,
    accent: "text-brand-purple",
    background: "bg-brand-purple/15",
  },
  {
    label: "Categorias clave",
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
  text: "Quiero mejorar mi enfoque y organizar mejor mi semana. Que libros deberia empezar y como los aplico?",
} as const;

export const howItWorksSteps = [
  {
    title: "Elige un libro",
    description:
      "Explora analisis editoriales en espanol sobre finanzas, habitos, productividad, negocios, mentalidad y liderazgo.",
    icon: Compass,
  },
  {
    title: "Aprende en 15 minutos",
    description:
      "Lee una experiencia clara con ideas principales, contexto, puntos clave y ejercicios practicos.",
    icon: Zap,
  },
  {
    title: "Pregunta y aterriza",
    description:
      "Usa la IA para encontrar recomendaciones, comparar ideas y convertir lo aprendido en acciones concretas.",
    icon: Target,
  },
] as const;

export const previewBooks = [
  {
    title: "Habitos Atomicos",
    author: "James Clear",
    category: "Habitos",
    duration: "15 min",
    accent: "from-brand-blue via-brand-purple to-brand-pink",
    pattern: "orb",
  },
  {
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    category: "Finanzas",
    duration: "15 min",
    accent: "from-emerald-300 to-cyan-300",
    pattern: "steps",
  },
  {
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    category: "Emprendimiento",
    duration: "15 min",
    accent: "from-orange-300 to-rose-400",
    pattern: "growth",
  },
] as const;

export const comparisonRows = [
  {
    feature: "Lectura guiada de 15 minutos",
    ceoteca: "Analisis editorial accionable",
    traditional: "Lectura completa sin guia",
  },
  {
    feature: "Aplicacion practica",
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
    ceoteca: "Resumenes narrados segun plan",
    traditional: "No siempre incluido",
  },
] as const;

export const audienceCards = [
  {
    name: "Emprendedores",
    role: "Negocios y ventas",
    quote:
      "Encuentran ideas de libros de negocio y las convierten en acciones simples para vender, decidir y construir con mas claridad.",
  },
  {
    name: "Profesionales",
    role: "Productividad y finanzas",
    quote:
      "Usan Ceoteca para aprender con foco, comparar ideas y aplicar sistemas de productividad, dinero y liderazgo.",
  },
  {
    name: "Lectores curiosos",
    role: "Crecimiento personal",
    quote:
      "Descubren que libros profundizar despues y construyen el habito de aprender sin depender de sesiones largas.",
  },
] as const;

export const landingFaqs = [
  {
    question: "Ceoteca reemplaza leer el libro completo?",
    answer:
      "No. Ceoteca es una experiencia educativa y editorial propia para comprender ideas centrales, aplicarlas y decidir que obras quieres leer completas.",
  },
  {
    question: "El contenido usa textos copiados de los libros?",
    answer:
      "No. Los analisis son textos propios de Ceoteca. No reproducimos capitulos, portadas oficiales ni citas inventadas.",
  },
  {
    question: "Que puede hacer la IA de Ceoteca?",
    answer:
      "Puede recomendar libros del catalogo, conectar ideas entre temas, ayudarte a aplicar un concepto, sugerir ejercicios y responder dentro del contexto autorizado de cada analisis.",
  },
  {
    question: "Puedo empezar gratis?",
    answer:
      "Si. Puedes crear una cuenta gratis para explorar Ceoteca. Los planes superiores desbloquean mas acceso, audio, actividades avanzadas y chat contextual segun disponibilidad.",
  },
] as const;

export const finalCta = {
  eyebrow: "Tu biblioteca accionable",
  title: "Construye el habito de aprender y aplicar.",
  description:
    "Empieza con una experiencia breve, descubre ideas utiles y usa Ceoteca para mejorar tus decisiones cada semana.",
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
