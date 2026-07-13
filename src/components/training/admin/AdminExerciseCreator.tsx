"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { editorialRequest } from "@/lib/training/editorial-api";
type Metadata = {
  skills: Array<{ id: string; name: string }>;
  concepts: Array<{ id: string; name: string; skill_id: string }>;
};
type Form = {
  title: string;
  type: string;
  skillId: string;
  conceptId: string;
  prompt: string;
  instruction: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedSeconds: number;
  hint: string;
  explanation: string;
  optionsText: string;
  correctOptionId: string;
  ownWords: boolean;
  noLongExcerpts: boolean;
  citationsIdentified: boolean;
  examplesAuthorized: boolean;
};
export function AdminExerciseCreator() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [status, setStatus] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: {
      type: "single_choice",
      difficulty: "intermediate",
      estimatedSeconds: 60,
      ownWords: false,
      noLongExcerpts: false,
      citationsIdentified: false,
      examplesAuthorized: false,
    },
  });
  const skillId = watch("skillId");
  useEffect(() => {
    editorialRequest<Metadata>("/api/admin/training/metadata")
      .then(setMetadata)
      .catch(() => setStatus("No pudimos cargar los metadatos editoriales."));
  }, []);
  async function submit(values: Form) {
    setStatus("Guardando…");
    const options = values.optionsText
      .split("\n")
      .map((label, index) => ({
        id: `option_${index + 1}`,
        label: label.trim(),
      }))
      .filter((item) => item.label);
    try {
      await editorialRequest("/api/admin/training/exercises", {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          type: values.type,
          skillId: values.skillId,
          conceptId: values.conceptId,
          prompt: values.prompt,
          instruction: values.instruction,
          difficulty: values.difficulty,
          estimatedSeconds: Number(values.estimatedSeconds),
          hint: values.hint || undefined,
          explanation: values.explanation,
          content: { options },
          evaluationConfig: { correctOptionId: values.correctOptionId },
          evaluationMode: "deterministic",
          compliance: {
            ownWords: values.ownWords,
            noLongExcerpts: values.noLongExcerpts,
            citationsIdentified: values.citationsIdentified,
            examplesAuthorized: values.examplesAuthorized,
          },
        }),
      });
      setStatus("Guardado");
      router.push("/admin/training/exercises");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo guardar");
    }
  }
  const input =
    "min-h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3";
  return (
    <>
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-bold text-violet-700">Paso {step} de 4</p>
        <h1 className="mt-1 text-3xl font-black">Crear ejercicio</h1>
        <p className="mt-1 text-slate-500">
          Borrador editorial guiado, sin JSON manual.
        </p>
      </header>
      <div className="mt-5 flex gap-2" aria-label="Progreso">
        {[1, 2, 3, 4].map((value) => (
          <span
            className={`h-2 flex-1 rounded-full ${value <= step ? "bg-violet-600" : "bg-slate-200"}`}
            key={value}
          />
        ))}
      </div>
      <form
        className="mt-6 rounded-[8px] border border-slate-200 bg-white p-5 sm:p-7"
        onSubmit={handleSubmit(submit)}
      >
        {step === 1 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Título interno
              <input
                className={input}
                {...register("title", { required: true })}
              />
            </label>
            <label className="grid gap-2 font-bold">
              Tipo
              <select className={input} {...register("type")}>
                {[
                  "single_choice",
                  "multiple_choice",
                  "true_false",
                  "ordering",
                  "flashcard",
                  "scenario",
                  "open_response",
                  "guided_builder",
                  "decision_justification",
                  "reflection",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              Habilidad
              <select
                className={input}
                {...register("skillId", { required: true })}
              >
                <option value="">Selecciona</option>
                {metadata?.skills.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              Concepto
              <select
                className={input}
                {...register("conceptId", { required: true })}
              >
                <option value="">Selecciona</option>
                {metadata?.concepts
                  .filter((item) => !skillId || item.skill_id === skillId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              Dificultad
              <select className={input} {...register("difficulty")}>
                <option value="beginner">Inicial</option>
                <option value="intermediate">Intermedia</option>
                <option value="advanced">Avanzada</option>
              </select>
            </label>
            <label className="grid gap-2 font-bold">
              Tiempo estimado (segundos)
              <input
                className={input}
                type="number"
                {...register("estimatedSeconds", { valueAsNumber: true })}
              />
            </label>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-5">
            <label className="grid gap-2 font-bold">
              Instrucción
              <textarea
                className={input}
                {...register("instruction", { required: true })}
              />
            </label>
            <label className="grid gap-2 font-bold">
              Pregunta o prompt
              <textarea
                className={`${input} min-h-28`}
                {...register("prompt", { required: true })}
              />
            </label>
            <label className="grid gap-2 font-bold">
              Pista
              <textarea className={input} {...register("hint")} />
            </label>
            <label className="grid gap-2 font-bold">
              Explicación razonada
              <textarea
                className={`${input} min-h-28`}
                {...register("explanation", { required: true })}
              />
            </label>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="grid gap-5">
            <label className="grid gap-2 font-bold">
              Opciones, una por línea
              <textarea
                className={`${input} min-h-36`}
                {...register("optionsText", { required: true })}
              />
            </label>
            <label className="grid gap-2 font-bold">
              ID correcto
              <input
                className={input}
                placeholder="option_1"
                {...register("correctOptionId", { required: true })}
              />
            </label>
            <p className="text-sm text-slate-500">
              Las respuestas correctas se guardan en reglas privadas y nunca en
              el snapshot público.
            </p>
          </div>
        ) : null}
        {step === 4 ? (
          <fieldset className="grid gap-4">
            <legend className="text-xl font-black">
              Cumplimiento editorial
            </legend>
            {[
              ["ownWords", "El contenido está redactado con palabras propias."],
              ["noLongExcerpts", "No contiene fragmentos extensos copiados."],
              ["citationsIdentified", "Las citas están identificadas."],
              [
                "examplesAuthorized",
                "Los ejemplos son originales o autorizados.",
              ],
            ].map(([name, label]) => (
              <label className="flex min-h-11 items-center gap-3" key={name}>
                <input
                  className="h-5 w-5 accent-violet-600"
                  type="checkbox"
                  {...register(name as keyof Form)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        ) : null}
        {Object.keys(errors).length ? (
          <p className="mt-4 text-sm font-bold text-rose-700">
            Completa los campos requeridos antes de continuar.
          </p>
        ) : null}
        <div className="mt-7 flex justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            className="min-h-11 rounded-[8px] border border-slate-300 px-5 font-bold disabled:opacity-40"
            disabled={step === 1}
            onClick={() => setStep((value) => value - 1)}
            type="button"
          >
            Atrás
          </button>
          {step < 4 ? (
            <button
              className="min-h-11 rounded-[8px] bg-violet-700 px-5 font-bold text-white"
              onClick={() => setStep((value) => value + 1)}
              type="button"
            >
              Continuar
            </button>
          ) : (
            <button
              className="min-h-11 rounded-[8px] bg-violet-700 px-5 font-bold text-white"
              type="submit"
            >
              Guardar borrador
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-3 text-sm text-slate-600">
          {status}
        </p>
      </form>
    </>
  );
}
