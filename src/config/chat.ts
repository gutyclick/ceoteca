import type { ConversationType } from "@/lib/chat/model";

export const chatComposerMaxLength = 2_000;
export const chatLowRemainingThreshold = 5;

export type ChatStarterPrompt = {
  id: string;
  label: string;
  prompt: string;
};

export const generalChatStarterPrompts: ChatStarterPrompt[] = [
  { id: "business-idea", label: "Analizar una idea de negocio", prompt: "Quiero analizar una idea de negocio." },
  { id: "sales-strategy", label: "Crear una estrategia de ventas", prompt: "Ayúdame a crear una estrategia de ventas." },
  { id: "client-message", label: "Mejorar un mensaje para un cliente", prompt: "Quiero mejorar un mensaje para un cliente." },
  { id: "business-problem", label: "Resolver un problema de mi negocio", prompt: "Ayúdame a resolver un problema de mi negocio." },
  { id: "action-plan", label: "Crear un plan de acción", prompt: "Quiero crear un plan de acción." },
  { id: "free-question", label: "Empezar una pregunta libre", prompt: "Quiero trabajar en " },
];

export const bookChatStarterPrompts: ChatStarterPrompt[] = [
  { id: "main-idea", label: "Entender la idea principal", prompt: "Explícame la idea más importante de este análisis." },
  { id: "practical-example", label: "Ver un ejemplo práctico", prompt: "Dame un ejemplo práctico para aplicar esta semana." },
  { id: "book-action-plan", label: "Crear un plan de acción", prompt: "Crea un plan de acción sencillo con estas ideas." },
];

export function getChatStarterPrompts(type: ConversationType) {
  return type === "book" ? bookChatStarterPrompts : generalChatStarterPrompts;
}

const followUpPromptGroups = {
  default: ["Dame un ejemplo", "Conviértelo en pasos", "Hazlo más breve"],
  steps: ["Dame un ejemplo", "Crea una checklist", "Adáptalo a mi negocio"],
  example: ["Conviértelo en pasos", "¿Qué error debo evitar?", "Hazlo más breve"],
} as const;

export function getChatFollowUpPrompts(lastResponse: string) {
  const normalized = lastResponse.toLocaleLowerCase("es");
  if (/\b(paso|lista|checklist)\b/.test(normalized)) return [...followUpPromptGroups.steps];
  if (/\b(ejemplo|caso|supongamos)\b/.test(normalized)) return [...followUpPromptGroups.example];
  return [...followUpPromptGroups.default];
}
