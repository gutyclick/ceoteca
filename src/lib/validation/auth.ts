import { z } from "zod";

import { planKeys } from "@/config/plans";

const planSchema = z.enum(planKeys).default("free");

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresa tu email.")
    .email("Ingresa un email válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const signUpSchema = signInSchema
  .extend({
    fullName: z
      .string()
      .min(2, "Ingresa tu nombre.")
      .max(80, "El nombre es demasiado largo."),
    confirmPassword: z
      .string()
      .min(8, "Confirma tu contraseña."),
    acceptedTerms: z
      .boolean()
      .refine((value) => value, "Debes aceptar términos y privacidad."),
    plan: planSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
