import { z } from "zod";

import { planKeys } from "@/config/plans";

const planSchema = z.enum(planKeys).default("free");

const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres.")
  .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, "Incluye al menos una letra.")
  .regex(/\d/, "Incluye al menos un número.");

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Ingresa tu email.")
    .email("Ingresa un email válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Ingresa tu email.")
      .email("Ingresa un email válido."),
    password: passwordSchema,
    fullName: z
      .string()
      .min(2, "Ingresa tu nombre.")
      .max(80, "El nombre es demasiado largo."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
    acceptedTerms: z
      .boolean()
      .refine((value) => value, "Debes aceptar términos y privacidad."),
    plan: planSchema,
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
