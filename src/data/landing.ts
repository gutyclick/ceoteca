import {
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  LibraryBig,
  MessageCircle,
  Play,
  Sparkles,
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
