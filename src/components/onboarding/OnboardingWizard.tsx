"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Loader2, MessageCircle, Mic2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { FaGoogle, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa6";

import { Logo } from "@/components/ui/Logo";
import { plans, type PlanKey } from "@/config/plans";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/types";

const occupations = [
  "Emprendedor o dueño de negocio",
  "Profesional independiente",
  "Empleado o líder de equipo",
  "Estudiante",
  "Inversionista",
  "Creador de contenido",
  "Otro",
] as const;

const discoverySources = [
  { value: "google", label: "Google", icon: FaGoogle, iconClassName: "text-[#4285F4]" },
  { value: "instagram", label: "Instagram", icon: FaInstagram, iconClassName: "text-[#E4405F]" },
  { value: "tiktok", label: "TikTok", icon: FaTiktok, iconClassName: "text-slate-950" },
  { value: "youtube", label: "YouTube", icon: FaYoutube, iconClassName: "text-[#FF0000]" },
  { value: "recommendation", label: "Recomendación", icon: MessageCircle, iconClassName: "text-emerald-600" },
  { value: "podcast_newsletter", label: "Podcast o newsletter", icon: Mic2, iconClassName: "text-violet-600" },
  { value: "community", label: "Comunidad o evento", icon: CalendarDays, iconClassName: "text-amber-600" },
  { value: "other", label: "Otro medio", icon: MoreHorizontal, iconClassName: "text-slate-500" },
] as const;

type DiscoverySource = (typeof discoverySources)[number]["value"];

export function OnboardingWizard({ books }: { books: Book[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [birthDate, setBirthDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [discoverySourcesSelected, setDiscoverySourcesSelected] = useState<DiscoverySource[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [starterBookId, setStarterBookId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalSteps = selectedPlan === "free" ? 4 : 3;

  async function finishOnboarding(plan: PlanKey, bookId: string | null) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
        router.replace("/home");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          birthDate: birthDate || null,
          occupation,
          discoverySources: discoverySourcesSelected,
          plan,
          starterBookId: bookId,
        }),
      });
      const payload = (await response.json()) as {
        data?: { redirectTo: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "No pudimos finalizar tu configuración.");
      }

      window.location.href = payload.data.redirectTo;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No pudimos continuar.");
      setIsSubmitting(false);
    }
  }

  function choosePlan(plan: PlanKey) {
    setSelectedPlan(plan);
    setError(null);

    if (plan === "free") {
      setStep(4);
      return;
    }

    void finishOnboarding(plan, null);
  }

  function toggleDiscoverySource(source: DiscoverySource) {
    setDiscoverySourcesSelected((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source],
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
      <header className="mx-auto flex min-h-20 w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Logo className="text-slate-950" useBrandAsset />
        <span className="text-sm font-bold text-slate-500">
          Paso {step} de {totalSteps}
        </span>
      </header>

      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <section className="mx-auto flex min-h-[calc(100vh-85px)] w-full max-w-[1080px] flex-col justify-center px-5 py-8 sm:px-8">
        {step === 1 ? (
          <div className="mx-auto w-full max-w-xl">
            <StepHeading title="Cuéntanos un poco sobre ti" description="Usaremos esta información para personalizar tu experiencia." />
            <div className="mt-8 grid gap-5">
              <label className="grid gap-2 text-sm font-black">
                Fecha de nacimiento <span className="font-medium text-slate-400">Opcional</span>
                <input
                  className="min-h-14 rounded-[14px] border border-slate-950/[0.10] bg-white px-4 text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setBirthDate(event.target.value)}
                  type="date"
                  value={birthDate}
                />
              </label>
              <label className="grid gap-2 text-sm font-black">
                ¿A qué te dedicas?
                <select
                  className="min-h-14 rounded-[14px] border border-slate-950/[0.10] bg-white px-4 text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  onChange={(event) => setOccupation(event.target.value)}
                  value={occupation}
                >
                  <option value="">Selecciona una opción</option>
                  {occupations.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <WizardActions disabled={!occupation} onNext={() => setStep(2)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mx-auto w-full max-w-2xl">
            <StepHeading title="¿Cómo conociste Ceoteca?" description="Puedes elegir más de una opción." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {discoverySources.map((source) => {
                const Icon = source.icon;
                const isSelected = discoverySourcesSelected.includes(source.value);

                return (
                  <button
                    aria-pressed={isSelected}
                    className={cn(
                    "flex min-h-16 items-center gap-4 rounded-[14px] border bg-white px-5 text-left text-sm font-black transition",
                    isSelected
                      ? "border-violet-500 bg-violet-50 text-violet-800 ring-4 ring-violet-100"
                      : "border-slate-950/[0.10] text-slate-700 hover:border-violet-200",
                  )}
                  key={source.value}
                  onClick={() => toggleDiscoverySource(source.value)}
                  type="button"
                >
                    <Icon aria-hidden="true" className={source.iconClassName} size={21} />
                    <span className="flex-1">{source.label}</span>
                    {isSelected ? <Check aria-hidden="true" size={18} /> : null}
                  </button>
                );
              })}
            </div>
            <WizardActions disabled={discoverySourcesSelected.length === 0} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="w-full">
            <StepHeading title="Elige cómo quieres empezar" description="Puedes cambiar de plan más adelante desde Ajustes." />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(["free", "pro", "unlimited", "founder"] as PlanKey[]).map((planKey) => {
                const plan = plans[planKey];
                return (
                  <button
                    className={cn(
                      "flex min-h-[285px] flex-col rounded-[18px] border bg-white p-5 text-left transition hover:border-violet-300",
                      (plan.isRecommended || plan.isFounderOffer) && "border-violet-300",
                    )}
                    disabled={isSubmitting}
                    key={planKey}
                    onClick={() => choosePlan(planKey)}
                    type="button"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-600">{plan.tagline}</p>
                    <h2 className="mt-3 text-2xl font-black">{plan.name}</h2>
                    <p className="mt-2 text-xl font-black">
                      {plan.monthlyPriceUsd === 0 ? "Gratis" : `USD ${plan.monthlyPriceUsd.toFixed(2)}/mes`}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
                    <ul className="mt-5 grid gap-2 text-sm text-slate-700">
                      {plan.highlights.slice(0, 3).map((item) => (
                        <li className="flex gap-2" key={item}><Check className="mt-0.5 shrink-0 text-emerald-600" size={16} />{item}</li>
                      ))}
                    </ul>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black text-violet-700">
                      {planKey === "free" ? "Elegir Gratis" : "Continuar"}<ArrowRight size={16} />
                    </span>
                  </button>
                );
              })}
            </div>
            <WizardActions isLoading={isSubmitting} onBack={() => setStep(2)} />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="w-full">
            <StepHeading title="Elige tu primer análisis" description="Tu plan Gratis incluye uno de estos análisis para comenzar." />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {books.map((book) => (
                <button
                  className={cn(
                    "overflow-hidden rounded-[16px] border bg-white p-3 text-left transition",
                    starterBookId === book.id
                      ? "border-violet-500 ring-4 ring-violet-100"
                      : "border-slate-950/[0.10] hover:border-violet-200",
                  )}
                  key={book.id}
                  onClick={() => setStarterBookId(book.id)}
                  type="button"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-violet-100">
                    {book.cover.imagePath ? (
                      <Image alt={`Portada de ${book.title}`} className="object-cover" fill sizes="180px" src={book.cover.imagePath} />
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-black leading-5">{book.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{book.author}</p>
                </button>
              ))}
            </div>
            <WizardActions
              disabled={!starterBookId}
              isLoading={isSubmitting}
              label="Finalizar"
              onBack={() => setStep(3)}
              onNext={() => selectedPlan && void finishOnboarding(selectedPlan, starterBookId)}
            />
          </div>
        ) : null}

        {error ? <p className="mx-auto mt-5 max-w-xl rounded-[12px] bg-rose-50 p-3 text-center text-sm font-bold text-rose-700">{error}</p> : null}
      </section>
    </main>
  );
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h1 className="text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

function WizardActions({
  onBack,
  onNext,
  disabled = false,
  isLoading = false,
  label = "Continuar",
}: {
  onBack?: () => void;
  onNext?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      {onBack ? (
        <button className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-black text-slate-600 hover:text-violet-700" onClick={onBack} type="button">
          <ArrowLeft size={17} /> Atrás
        </button>
      ) : <span />}
      {onNext ? (
        <button
          className="inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || isLoading}
          onClick={onNext}
          type="button"
        >
          {isLoading ? <Loader2 className="animate-spin" size={17} /> : null}
          {label}<ArrowRight size={17} />
        </button>
      ) : isLoading ? (
        <span className="inline-flex items-center gap-2 text-sm font-bold text-violet-700"><Loader2 className="animate-spin" size={17} />Guardando...</span>
      ) : null}
    </div>
  );
}
