import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Clock3,
  Grid3X3,
  Heart,
  LibraryBig,
  MessageCircle,
  Rocket,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { siteConfig } from "@/config/site";

export const heroActions = {
  primary: {
    href: "/registro",
    label: "Empieza gratis",
    icon: ArrowRight,
  },
  secondary: {
    href: "/biblioteca",
    label: "Explorar biblioteca",
    icon: BookOpen,
  },
} as const;

export const featuredBookFacts = [
  { label: "10 ideas clave", icon: Sparkles },
  { label: "Plantillas", icon: Grid3X3 },
] as const;

export const productStats = [
  {
    label: "Análisis disponibles",
    value: siteConfig.productMetrics.learningPaths,
    icon: LibraryBig,
    accent: "text-violet-600",
    background: "bg-violet-50",
    valueClass: "text-violet-600",
  },
  {
    label: "Categorías",
    value: siteConfig.productMetrics.categories,
    icon: Grid3X3,
    accent: "text-emerald-600",
    background: "bg-emerald-50",
    valueClass: "text-emerald-600",
  },
  {
    label: "Usuarios activos",
    value: siteConfig.productMetrics.formats,
    icon: Users,
    accent: "text-sky-600",
    background: "bg-sky-50",
    valueClass: "text-sky-600",
  },
  {
    label: "Valoración de usuarios",
    value: siteConfig.productMetrics.focus,
    icon: Star,
    accent: "text-amber-500",
    background: "bg-amber-50",
    valueClass: "text-slate-950",
  },
] as const;

export const howItWorksSteps = [
  {
    title: "Elige un libro",
    description:
      "Explora nuestra biblioteca y elige un análisis que conecte con lo que quieres mejorar.",
    icon: BookOpen,
    accent: "bg-violet-50 text-violet-600",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    title: "Aprende ideas clave",
    description:
      "Accede a conceptos esenciales, ejemplos y marcos prácticos sin perder el contexto.",
    icon: Zap,
    accent: "bg-sky-50 text-sky-600",
    badge: "bg-sky-100 text-sky-700",
  },
  {
    title: "Aplica con intención",
    description:
      "Usa ejercicios, plantillas y preguntas guiadas para llevar las ideas a tu vida o negocio.",
    icon: Target,
    accent: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Obtén resultados",
    description:
      "Convierte tu aprendizaje en hábitos, mejores decisiones y progreso constante.",
    icon: BarChart3,
    accent: "bg-amber-50 text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
] as const;

export const previewBooks = [
  {
    title: "Hábitos Atómicos",
    author: "James Clear",
    category: "Desarrollo personal",
    duration: "10 ideas clave",
    accent: "from-violet-600 via-purple-600 to-pink-500",
    pattern: "brain",
    imagePath: "/images/PORTADAS%20EN%20PNG/HABITOS%20ATOMICOS.png",
  },
  {
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    category: "Finanzas personales",
    duration: "12 ideas clave",
    accent: "from-emerald-950 via-teal-900 to-slate-950",
    pattern: "money",
    imagePath: "/images/PORTADAS%20EN%20PNG/043_PADRE_RICO_PADRE_POBRE.png",
  },
  {
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    category: "Emprendimiento",
    duration: "8 ideas clave",
    accent: "from-slate-950 via-blue-950 to-slate-900",
    pattern: "rocket",
    imagePath: "/images/PORTADAS%20EN%20PNG/EL%20EMPRENDIMIENTO%20DE%20LOS%20100.png",
  },
  {
    title: "Piense y hágase rico",
    author: "Napoleon Hill",
    category: "Ingresos y riqueza",
    duration: "10 ideas clave",
    accent: "from-yellow-950 via-amber-900 to-slate-950",
    pattern: "growth",
    imagePath: "/images/PORTADAS%20EN%20PNG/045_TE_ENSE%C3%91AR%C3%89_A_SER_RICO.png",
  },
  {
    title: "Los 7 hábitos de la gente altamente efectiva",
    author: "Stephen R. Covey",
    category: "Productividad",
    duration: "10 ideas clave",
    accent: "from-slate-950 via-indigo-950 to-purple-950",
    pattern: "target",
    imagePath: "/images/PORTADAS%20EN%20PNG/086_LOS_7_H%C3%81BITOS_DE_LA_GENTE_ALTAMENTE_EFECTIVA.png",
  },
] as const;

export const comparisonRows = [
  {
    feature: "Análisis originales",
    ceoteca: "Contenido creado para entender, conectar y aplicar ideas.",
    traditional: "Lectura completa sin estructura de aplicación.",
  },
  {
    feature: "Enfoque práctico",
    ceoteca: "Ejercicios, plantillas y próximos pasos accionables.",
    traditional: "Depende de tus notas y seguimiento personal.",
  },
  {
    feature: "Ahorro de tiempo",
    ceoteca: "Identifica ideas útiles antes de decidir qué profundizar.",
    traditional: "Requiere más exploración inicial.",
  },
  {
    feature: "Mejora continua",
    ceoteca: "Nuevos análisis, progreso y recomendaciones cada semana.",
    traditional: "Sin seguimiento centralizado.",
  },
] as const;

export const audienceCards = [
  {
    name: "Marcela R.",
    role: "Emprendedora",
    quote:
      "Ceoteca me ayuda a conectar libros con decisiones reales para mi negocio, sin perder el valor de leer con profundidad.",
  },
  {
    name: "Andrés M.",
    role: "Fundador",
    quote:
      "Los análisis son claros, accionables y me ayudan a convertir ideas en experimentos concretos.",
  },
  {
    name: "Sofía L.",
    role: "Inversionista",
    quote:
      "Me gusta cómo conecta conceptos con ejemplos prácticos y preguntas para pensar mejor.",
  },
] as const;

export const landingFaqs = [
  {
    question: "¿Cómo funciona Ceoteca?",
    answer:
      "Eliges un análisis editorial, aprendes ideas clave, revisas ejemplos y conviertes el contenido en acciones concretas con ejercicios y recomendaciones.",
  },
  {
    question: "¿Cómo se crean los análisis?",
    answer:
      "Son contenidos editoriales propios, preparados para complementar la lectura original. No copiamos capítulos, portadas oficiales ni citas inventadas.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. Cuando activemos pagos, podrás administrar tu suscripción desde tu cuenta y conservar el acceso correspondiente a tu plan activo.",
  },
  {
    question: "¿Los análisis incluyen plantillas o ejercicios?",
    answer:
      "Sí. Cada experiencia puede incluir ideas clave, ejercicios, reflexiones, quizzes, audio y recomendaciones según el tipo de libro y tu plan.",
  },
  {
    question: "¿Ceoteca reemplaza leer el libro completo?",
    answer:
      "No. Ceoteca complementa tus lecturas: te ayuda a descubrir ideas, aplicarlas y decidir qué obras quieres profundizar después.",
  },
] as const;

export const finalCta = {
  eyebrow: "Tu próxima idea clave está a un clic",
  title: "Empieza gratis y transforma tu forma de aprender.",
  description:
    "Accede a análisis prácticos en español, recomendaciones y herramientas para convertir ideas en acción.",
  primary: {
    href: "/registro",
    label: "Empieza gratis",
    icon: Rocket,
  },
  secondary: {
    href: "/biblioteca",
    label: "Explorar biblioteca",
    icon: LibraryBig,
  },
} as const;

export const whyCeotecaItems = [
  {
    title: "Análisis originales",
    description: "Contenido creado por expertos, sin copiados ni relleno.",
    icon: Sparkles,
    accent: "text-violet-600 bg-violet-50",
  },
  {
    title: "Enfoque práctico",
    description: "Ideas accionables, ejemplos reales y marcos útiles.",
    icon: Brain,
    accent: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Ahorra tiempo",
    description: "Obtén minutos valiosos antes de profundizar en cada libro.",
    icon: Clock3,
    accent: "text-sky-600 bg-sky-50",
  },
  {
    title: "Mejora continua",
    description: "Nuevos análisis y progreso para mantener el hábito.",
    icon: Heart,
    accent: "text-pink-600 bg-pink-50",
  },
] as const;

export const aiQuestion = {
  icon: MessageCircle,
  text: "Quiero mejorar mi enfoque y organizar mejor mi semana. ¿Qué libros debería explorar y cómo puedo aplicar sus ideas?",
} as const;

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

export const heroBadgeAvatars = ["M", "A", "J", "C"] as const;

export const visualCards = [] as const;

export const heroMiniReads = [
  {
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    progress: 60,
    imagePath: "/images/PORTADAS%20EN%20PNG/043_PADRE_RICO_PADRE_POBRE.png",
  },
  {
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    progress: 40,
    imagePath: "/images/PORTADAS%20EN%20PNG/EL%20EMPRENDIMIENTO%20DE%20LOS%20100.png",
  },
  {
    title: "Piense y hágase rico",
    author: "Napoleon Hill",
    progress: 20,
    imagePath: "/images/PORTADAS%20EN%20PNG/045_TE_ENSE%C3%91AR%C3%89_A_SER_RICO.png",
  },
] as const;

export const heroBookCover = {
  title: "Hábitos Atómicos",
  author: "James Clear",
  progress: 35,
  imagePath: "/images/PORTADAS%20EN%20PNG/HABITOS%20ATOMICOS.png",
} as const;

export const bookIconMap = {
  brain: Bot,
  money: BarChart3,
  rocket: Rocket,
  growth: BarChart3,
  target: Target,
  default: BookOpen,
} as const;
