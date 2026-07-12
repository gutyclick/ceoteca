import type { SkillProgress, TrainingActivity, TrainingCategory, TrainingRecommendation } from "@/types/training";

export const todayTraining: TrainingRecommendation = {
  id: "value-proposition",
  category: "Marketing",
  title: "Mejora tu capacidad para crear propuestas de valor",
  description: "Practicarás claridad, diferenciación y conocimiento del cliente con ejercicios basados en 3 libros.",
  durationMinutes: 7,
  exerciseCount: 8,
  level: "Intermedio",
  icon: "target",
  bookCovers: [
    { title: "La disciplina de emprender", imagePath: "/images/PORTADAS EN PNG/LA DISCIPLINA DE EMPRENDER.png" },
    { title: "La Startup de $100", imagePath: "/images/PORTADAS EN PNG/EL EMPRENDIMIENTO DE LOS 100.png" },
    { title: "Hábitos Atómicos", imagePath: "/images/PORTADAS EN PNG/HABITOS ATOMICOS.png" },
  ],
  streak: {
    completedDays: 4,
    days: [
      { label: "L", completed: true }, { label: "M", completed: true },
      { label: "M", completed: true }, { label: "J", completed: true },
      { label: "V", completed: false }, { label: "S", completed: false },
      { label: "D", completed: false },
    ],
  },
};

export const continueTraining: TrainingActivity[] = [
  { id: "sustainable-routine", title: "Diseña una rutina sostenible", description: "Fortalece hábitos y consistencia diaria.", status: "in_progress", progress: 60, progressLabel: "6 de 10 ejercicios", detail: "4 min restantes", ctaLabel: "Continuar", icon: "calendar" },
  { id: "clear-communication", title: "Comunica con claridad", description: "Practica feedback, visión y mensajes clave.", status: "needs_review", progress: 67, progressLabel: "Completado", detail: "Repaso recomendado", ctaLabel: "Reforzar", icon: "megaphone" },
];

export const trainingCategories: TrainingCategory[] = [
  { id: "marketing", name: "Marketing", mastery: 62, recommendation: "Propuesta de valor", icon: "target" },
  { id: "personal-growth", name: "Desarrollo personal", mastery: 71, recommendation: "Hábitos", icon: "leaf" },
  { id: "leadership", name: "Liderazgo", mastery: 54, recommendation: "Feedback", icon: "crown" },
  { id: "finance", name: "Finanzas", mastery: 38, recommendation: "Presupuesto", icon: "chart" },
  { id: "entrepreneurship", name: "Emprendimiento", mastery: 65, recommendation: "Validación", icon: "rocket" },
];

export const skillProgress: SkillProgress[] = [
  { id: "value-proposition", label: "Propuesta de valor", progress: 78, level: "Competente" },
  { id: "habits", label: "Hábitos", progress: 71, level: "En desarrollo" },
  { id: "communication", label: "Comunicación", progress: 54, level: "Por reforzar" },
  { id: "personal-finance", label: "Finanzas personales", progress: 38, level: "Descubriendo" },
  { id: "idea-validation", label: "Validación de ideas", progress: 65, level: "En desarrollo" },
];
