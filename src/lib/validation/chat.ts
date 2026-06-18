import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  bookId: z.string().min(1, "El libro es requerido."),
  message: z
    .string()
    .min(1, "Escribe una pregunta.")
    .max(2000, "La pregunta no puede superar 2000 caracteres."),
  conversation: z.array(chatMessageSchema).max(12).default([]),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatConversationMessage = z.infer<typeof chatMessageSchema>;
