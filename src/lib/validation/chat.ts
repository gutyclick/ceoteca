import { z } from "zod";

import { chatComposerMaxLength } from "@/config/chat";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

export const chatRequestSchema = z
  .object({
    type: z.enum(["general", "book"]).optional(),
    context: z.enum(["book", "site"]).optional(),
    bookId: z.string().min(1, "El libro es requerido.").optional(),
    conversationId: z.string().uuid("La conversación no es válida.").optional(),
    clientCreationKey: z.string().uuid("La clave de creación no es válida.").optional(),
    clientMessageId: z.string().uuid("El identificador del mensaje no es válido."),
    uploadSessionId: z.string().uuid("La sesión de archivos no es válida.").optional(),
    attachmentIds: z.array(z.string().uuid("El archivo no es válido.")).max(5).default([]),
    interactionType: z.enum(["message", "contextual_action"]).default("message"),
    stream: z.boolean().default(false),
    message: z
      .string()
      .trim()
      .max(
        chatComposerMaxLength,
        "Tu mensaje es demasiado largo. Reduce el contenido para continuar.",
      )
      .default(""),
    conversation: z.array(chatMessageSchema).max(12).default([]),
  })
  .superRefine((value, context) => {
    const type = value.type ?? (value.context === "site" ? "general" : "book");
    if (type === "book" && !value.bookId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El libro es requerido.",
        path: ["bookId"],
      });
    }
    if (!value.conversationId && !value.clientCreationKey) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La clave de creación es requerida para una conversación nueva.",
        path: ["clientCreationKey"],
      });
    }
    if (!value.message && value.attachmentIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Escribe una pregunta o adjunta un archivo.",
        path: ["message"],
      });
    }
    if (value.attachmentIds.length > 0 && !value.uploadSessionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La sesión de archivos es requerida.",
        path: ["uploadSessionId"],
      });
    }
  });

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatConversationMessage = z.infer<typeof chatMessageSchema>;
