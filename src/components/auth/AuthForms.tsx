'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { loginSchema, registerSchema } from '@/lib/validation/auth';
import type { PlanId } from '@/types';

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

function passwordStrength(password = '') {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
}

export function RegisterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const selectedPlan = (params.get('plan') ?? 'free') as PlanId;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      plan: selectedPlan,
      terms: false,
    },
  });

  async function onSubmit(data: RegisterData) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSuccess(true);
    router.push(data.plan === 'free' ? '/home' : '/planes');
  }

  const strength = passwordStrength(watch('password'));

  return (
    <form className="glass mx-auto max-w-lg rounded-3xl p-6" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-3xl font-black">Crear cuenta</h1>
      <p className="mt-2 text-zinc-300">
        Plan seleccionado: <b>{selectedPlan}</b>
      </p>

      <input type="hidden" value={selectedPlan} {...register('plan')} />

      <label className="mt-4 block" htmlFor="fullName">
        <span className="text-sm">Nombre</span>
        <input
          id="fullName"
          className="focus-ring mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-3"
          autoComplete="name"
          {...register('fullName')}
          aria-invalid={Boolean(errors.fullName)}
        />
        <span className="text-sm text-pink-300" role="alert">
          {errors.fullName?.message}
        </span>
      </label>

      <label className="mt-4 block" htmlFor="email">
        <span className="text-sm">Email</span>
        <input
          id="email"
          type="email"
          className="focus-ring mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-3"
          autoComplete="email"
          {...register('email')}
          aria-invalid={Boolean(errors.email)}
        />
        <span className="text-sm text-pink-300" role="alert">
          {errors.email?.message}
        </span>
      </label>

      <label className="mt-4 block" htmlFor="password">
        <span className="text-sm">Contraseña</span>
        <input
          id="password"
          type="password"
          className="focus-ring mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-3"
          autoComplete="new-password"
          {...register('password')}
          aria-invalid={Boolean(errors.password)}
        />
        <span className="text-sm text-pink-300" role="alert">
          {errors.password?.message}
        </span>
      </label>

      <div className="mt-3 h-2 rounded bg-white/10" aria-label={`Seguridad ${strength}%`}>
        <div
          className="h-2 rounded bg-gradient-to-r from-indigo-500 to-pink-500 transition-all"
          style={{ width: `${strength}%` }}
        />
      </div>

      <label className="mt-4 block" htmlFor="confirmPassword">
        <span className="text-sm">Confirmar contraseña</span>
        <input
          id="confirmPassword"
          type="password"
          className="focus-ring mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-3"
          autoComplete="new-password"
          {...register('confirmPassword')}
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        <span className="text-sm text-pink-300" role="alert">
          {errors.confirmPassword?.message}
        </span>
      </label>

      <label className="mt-4 flex gap-2 text-sm">
        <input type="checkbox" {...register('terms')} />
        Acepto los <Link href="/terminos" className="underline">términos</Link> y la privacidad.
      </label>
      <p className="text-sm text-pink-300" role="alert">
        {errors.terms?.message}
      </p>

      <button
        className="focus-ring mt-5 w-full rounded-2xl bg-white p-3 font-bold text-black disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creando...' : 'Crear cuenta gratis'}
      </button>
      <button type="button" className="focus-ring mt-3 w-full rounded-2xl border border-white/15 p-3">
        Continuar con Google
      </button>
      {success && <p className="mt-3 text-green-300">Cuenta demo creada.</p>}
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 400));
    router.push('/home');
  }

  return (
    <form className="glass mx-auto max-w-lg rounded-3xl p-6" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-3xl font-black">Iniciar sesión</h1>

      <label className="mt-4 block" htmlFor="loginEmail">
        Email
        <input
          id="loginEmail"
          type="email"
          className="focus-ring mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-3"
          autoComplete="email"
          {...register('email')}
        />
        <span className="text-sm text-pink-300" role="alert">
          {errors.email?.message}
        </span>
      </label>

      <label className="mt-4 block" htmlFor="loginPassword">
        Contraseña
        <input
          id="loginPassword"
          type="password"
          className="focus-ring mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-3"
          autoComplete="current-password"
          {...register('password')}
        />
        <span className="text-sm text-pink-300" role="alert">
          {errors.password?.message}
        </span>
      </label>

      <div className="mt-4 flex justify-between text-sm">
        <label className="flex gap-2">
          <input type="checkbox" {...register('remember')} /> Recordarme
        </label>
        <Link href="#" className="underline">
          Recuperar contraseña
        </Link>
      </div>

      <button
        className="focus-ring mt-5 w-full rounded-2xl bg-white p-3 font-bold text-black disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
      <button type="button" className="focus-ring mt-3 w-full rounded-2xl border border-white/15 p-3">
        Continuar con Google
      </button>
      <p className="mt-4 text-sm text-zinc-300">
        ¿No tienes cuenta? <Link href="/registro" className="underline">Regístrate</Link>
      </p>
    </form>
  );
}
