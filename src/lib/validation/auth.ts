import { z } from 'zod';

export const planSchema = z.enum(['free', 'pro', 'unlimited', 'founder']);

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Escribe tu nombre.'),
    email: z.string().trim().email('Email inválido.'),
    password: z
      .string()
      .min(8, 'Usa al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye una mayúscula.')
      .regex(/[0-9]/, 'Incluye un número.'),
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar los términos.' }),
    }),
    plan: planSchema.default('free'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
  remember: z.boolean().optional(),
});
