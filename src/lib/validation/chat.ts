import { z } from "zod";

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
    message: z
      .string()
      .min(1, "Escribe una pregunta.")
      .max(2000, "La pregunta no puede superar 2000 caracteres."),
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
  });

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatConversationMessage = z.infer<typeof chatMessageSchema>;
