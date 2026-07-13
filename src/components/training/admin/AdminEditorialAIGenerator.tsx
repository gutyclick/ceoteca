"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  Check,
  Coins,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { editorialRequest } from "@/lib/training/editorial-api";

type Task =
  | "generate_exercises"
  | "generate_distractors"
  | "improve_feedback"
  | "generate_variations"
  | "suggest_rubric"
  | "review_exercise"
  | "suggest_classification"
  | "suggest_template";
type Metadata = {
  categories: Array<{ id: string; name: string }>;
  skills: Array<{ id: string; name: string; category_id: string }>;
  concepts: Array<{ id: string; name: string; skill_id: string }>;
  books: Array<{ id: string; title: string; author: string }>;
  editorialAI: { enabled: boolean; maxExercisesPerJob: number };
};
type Form = {
  task: Task;
  sourceMode: "concept" | "analysis";
  categoryId: string;
  skillId: string;
  conceptId: string;
  bookId: string;
  objective: string;
  principle: string;
  commonMistakes: string;
  approvedExamples: string;
  editorialNotes: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  count: number;
  estimatedSeconds: number;
  exerciseId: string;
  prompt: string;
  correctAnswer: string;
  currentFeedback: string;
  expectedOutcome: string;
  variationType:
    | "new_context"
    | "same_difficulty"
    | "easier"
    | "harder"
    | "new_sector"
    | "entrepreneur"
    | "salesperson"
    | "student"
    | "leader";
  durationMinutes: number;
  audience: string;
  reviewPercentage: number;
  plan: "free" | "pro" | "unlimited" | "founder";
  copyrightConfirmed: boolean;
  noFullBookConfirmed: boolean;
  noLongQuotesConfirmed: boolean;
};
type AIResult = {
  id: string;
  result_type: string;
  status: string;
  output: Record<string, unknown>;
  confidence: number | null;
  validation_issues: string[];
  saved_entity_id?: string | null;
};
type AnalysisSection = {
  id: string;
  title: string;
  sectionType: string;
  content: string;
  characterCount: number;
};
type Job = {
  id: string;
  status: string;
  estimated_cost: number;
  model: string;
  prompt_version: string;
  results: AIResult[];
};

const tasks: Array<{ value: Task; label: string; description: string }> = [
  {
    value: "generate_exercises",
    label: "Ejercicios",
    description: "Crea hasta cinco borradores desde un concepto.",
  },
  {
    value: "generate_distractors",
    label: "Distractores",
    description: "Propone opciones plausibles sin insertarlas.",
  },
  {
    value: "improve_feedback",
    label: "Feedback",
    description: "Compara el texto actual con una propuesta.",
  },
  {
    value: "generate_variations",
    label: "Variaciones",
    description: "Conserva el objetivo y cambia el contexto.",
  },
  {
    value: "suggest_rubric",
    label: "Rúbrica",
    description: "Sugiere criterios y pesos para ejercicios abiertos.",
  },
  {
    value: "review_exercise",
    label: "Claridad",
    description: "Detecta ambigüedad y riesgos editoriales.",
  },
  {
    value: "suggest_classification",
    label: "Clasificación",
    description: "Sugiere categoría, habilidad y dificultad.",
  },
  {
    value: "suggest_template",
    label: "Sesión",
    description: "Ordena ejercicios publicados y elegibles.",
  },
];

const exerciseTypes = [
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
] as const;

const inputClass =
  "min-h-11 w-full rounded-[8px] border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

const outputLabels: Record<string, string> = {
  internalTitle: "Título interno",
  instruction: "Instrucción",
  prompt: "Enunciado",
  difficulty: "Dificultad",
  estimatedSeconds: "Duración estimada",
  hint: "Pista",
  explanation: "Explicación",
  principleApplied: "Principio aplicado",
  practicalApplication: "Aplicación práctica",
  content: "Contenido",
  evaluationConfig: "Configuración de evaluación",
  sourceReferences: "Referencias de origen",
  warnings: "Advertencias",
  confidence: "Confianza",
  feedbackCorrect: "Feedback correcto",
  feedbackIncorrect: "Feedback incorrecto",
  feedbackRetry: "Feedback para reintentar",
  criteria: "Criterios",
  commonMistakes: "Errores frecuentes",
  exerciseIds: "Ejercicios",
  estimatedMinutes: "Duración estimada",
};

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function PreviewValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value))
    return (
      <ul className="grid gap-2">
        {value.map((item, index) => (
          <li className="border-l-2 border-violet-200 pl-3" key={index}>
            <PreviewValue value={item} />
          </li>
        ))}
      </ul>
    );
  if (typeof value === "object")
    return (
      <dl className="grid gap-3">
        {Object.entries(value as Record<string, unknown>).map(
          ([key, child]) => (
            <div key={key}>
              <dt className="text-xs font-bold uppercase text-slate-500">
                {outputLabels[key] ?? key.replaceAll("_", " ")}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-slate-700">
                <PreviewValue value={child} />
              </dd>
            </div>
          ),
        )}
      </dl>
    );
  if (typeof value === "boolean") return <span>{value ? "Sí" : "No"}</span>;
  return <span>{String(value)}</span>;
}

export function AdminEditorialAIGenerator() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "single_choice",
  ]);
  const [estimate, setEstimate] = useState<{
    estimatedCost: number;
    inputTokens: number;
    outputTokens: number;
    modelTier: string;
  } | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysisSections, setAnalysisSections] = useState<AnalysisSection[]>(
    [],
  );
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [editedOutputs, setEditedOutputs] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const {
    register,
    watch,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: {
      task: "generate_exercises",
      sourceMode: "concept",
      difficulty: "intermediate",
      count: 3,
      estimatedSeconds: 75,
      variationType: "new_context",
      durationMinutes: 10,
      audience: "Emprendedores y profesionales",
      reviewPercentage: 20,
      plan: "pro",
      copyrightConfirmed: false,
      noFullBookConfirmed: false,
      noLongQuotesConfirmed: false,
    },
  });
  const task = watch("task");
  const sourceMode = watch("sourceMode");
  const bookId = watch("bookId");
  const categoryId = watch("categoryId");
  const skillId = watch("skillId");
  const selectedTask = tasks.find((item) => item.value === task) ?? tasks[0];
  const filteredSkills = useMemo(
    () =>
      metadata?.skills.filter(
        (item) => !categoryId || item.category_id === categoryId,
      ) ?? [],
    [categoryId, metadata],
  );
  const filteredConcepts = useMemo(
    () =>
      metadata?.concepts.filter(
        (item) => !skillId || item.skill_id === skillId,
      ) ?? [],
    [skillId, metadata],
  );

  useEffect(() => {
    editorialRequest<Metadata>("/api/admin/training/metadata")
      .then(setMetadata)
      .catch(() => setStatus("No pudimos cargar la configuración editorial."));
  }, []);
  useEffect(() => {
    setEstimate(null);
    setJob(null);
    setStatus("");
  }, [task]);
  useEffect(() => {
    if (sourceMode !== "analysis" || !bookId) {
      setAnalysisSections([]);
      setSelectedSections([]);
      return;
    }
    editorialRequest<AnalysisSection[]>(
      `/api/admin/training/analysis-sections?bookId=${encodeURIComponent(bookId)}`,
    )
      .then((sections) => {
        setAnalysisSections(sections);
        setSelectedSections([]);
      })
      .catch(() =>
        setStatus("No pudimos cargar las secciones autorizadas del análisis."),
      );
  }, [bookId, sourceMode]);

  function buildExercise(values: Form) {
    return {
      type: "single_choice",
      internalTitle: "Ejercicio para revisión",
      instruction: "Revisa el enunciado y responde.",
      prompt: values.prompt,
      difficulty: values.difficulty,
      estimatedSeconds: values.estimatedSeconds,
      skillId: values.skillId || undefined,
      conceptId: values.conceptId || undefined,
      explanation: values.principle,
      content: {
        options: [
          {
            id: "option_1",
            label: values.correctAnswer || "Respuesta propuesta",
          },
          { id: "option_2", label: "Alternativa por revisar" },
        ],
      },
      evaluationConfig: { correctOptionId: "option_1" },
      sourceReferences: [],
      warnings: [],
      confidence: 0.5,
    };
  }

  function payload(values: Form) {
    const category =
      metadata?.categories.find((item) => item.id === values.categoryId)
        ?.name ?? "Sin categoría";
    const skill =
      metadata?.skills.find((item) => item.id === values.skillId)?.name ??
      "Sin habilidad";
    const concept =
      metadata?.concepts.find((item) => item.id === values.conceptId)?.name ??
      "Sin concepto";
    const book = metadata?.books.find((item) => item.id === values.bookId);
    const clientJobId = crypto.randomUUID();
    const selectedAnalysis = analysisSections.filter((section) =>
      selectedSections.includes(section.id),
    );
    const approvedPrinciple =
      values.sourceMode === "analysis"
        ? selectedAnalysis
            .map((section) => `${section.title}: ${section.content}`)
            .join("\n\n")
            .slice(0, 6000)
        : values.principle;
    if (values.task === "generate_exercises")
      return {
        clientJobId,
        sourceType: values.sourceMode,
        sourceId: values.sourceMode === "analysis" ? values.bookId : undefined,
        context: {
          category,
          skill,
          concept,
          learningObjective: values.objective,
          principleSummary: approvedPrinciple,
          commonMistakes: lines(values.commonMistakes),
          approvedExamples: lines(values.approvedExamples),
          sourceReferences: book
            ? [
                {
                  bookTitle: book.title,
                  author: book.author,
                  internalReference: book.id,
                },
              ]
            : [],
          editorialNotes:
            values.sourceMode === "analysis"
              ? `Secciones autorizadas: ${selectedAnalysis.map((section) => section.id).join(", ")}`
              : values.editorialNotes || undefined,
        },
        difficulty: values.difficulty,
        types: selectedTypes,
        count: values.count,
        tone: "professional",
        estimatedSeconds: values.estimatedSeconds,
        categoryId: values.categoryId || undefined,
        skillId: values.skillId,
        conceptId: values.conceptId,
        copyrightConfirmed: values.copyrightConfirmed,
        noFullBookConfirmed: values.noFullBookConfirmed,
        noLongQuotesConfirmed: values.noLongQuotesConfirmed,
      };
    if (values.task === "generate_distractors")
      return {
        clientJobId,
        exerciseId: values.exerciseId || undefined,
        question: values.prompt,
        correctAnswer: values.correctAnswer,
        concept,
        difficulty: values.difficulty,
        commonMistakes: lines(values.commonMistakes),
        count: values.count,
      };
    if (values.task === "improve_feedback")
      return {
        clientJobId,
        exerciseId: values.exerciseId || undefined,
        prompt: values.prompt,
        options: [],
        correctAnswer: values.correctAnswer,
        concept,
        principle: values.principle,
        commonMistake: lines(values.commonMistakes)[0],
        currentFeedback: values.currentFeedback || undefined,
      };
    if (values.task === "generate_variations")
      return {
        clientJobId,
        exerciseId: values.exerciseId,
        variationType: values.variationType,
        count: values.count,
      };
    if (values.task === "suggest_rubric")
      return {
        clientJobId,
        exerciseId: values.exerciseId || undefined,
        objective: values.objective,
        skill,
        concept,
        difficulty: values.difficulty,
        prompt: values.prompt,
        approvedExamples: lines(values.approvedExamples),
        expectedOutcome: values.expectedOutcome,
      };
    if (values.task === "review_exercise")
      return {
        clientJobId,
        exerciseId: values.exerciseId || undefined,
        exercise: buildExercise(values),
      };
    if (values.task === "suggest_classification")
      return { clientJobId, exercise: buildExercise(values) };
    return {
      clientJobId,
      skillId: values.skillId,
      durationMinutes: values.durationMinutes,
      difficulty: values.difficulty,
      audience: values.audience,
      objective: values.objective,
      approximateExerciseCount: values.count,
      reviewPercentage: values.reviewPercentage,
      allowsAI: false,
      plan: values.plan,
    };
  }

  const endpoint: Record<Task, string> = {
    generate_exercises: "generate-exercises",
    generate_distractors: "generate-distractors",
    improve_feedback: "improve-feedback",
    generate_variations: "generate-variations",
    suggest_rubric: "suggest-rubric",
    review_exercise: "review-exercise",
    suggest_classification: "suggest-classification",
    suggest_template: "suggest-template",
  };

  async function prepare(values: Form) {
    if (
      values.task === "generate_exercises" &&
      values.sourceMode === "analysis" &&
      (!values.bookId || selectedSections.length === 0)
    ) {
      setStatus("Selecciona un análisis y al menos una sección autorizada.");
      return;
    }
    const body = payload(values);
    try {
      const result = await editorialRequest<{
        estimatedCost: number;
        inputTokens: number;
        outputTokens: number;
        modelTier: string;
      }>("/api/admin/training/ai/estimate", {
        method: "POST",
        body: JSON.stringify({
          jobType: values.task,
          count: values.count,
          characterCount: JSON.stringify(body).length,
        }),
      });
      setEstimate(result);
      setStatus("Revisa la estimación y confirma para generar.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos preparar la generación.",
      );
    }
  }

  async function generate() {
    const values = getValues();
    setBusy(true);
    setStatus("Generando y validando el borrador…");
    try {
      const result = await editorialRequest<Job>(
        `/api/admin/training/ai/${endpoint[values.task]}`,
        { method: "POST", body: JSON.stringify(payload(values)) },
      );
      setJob(result);
      setEditedOutputs({});
      setStatus(
        result.status === "completed"
          ? "Generación completada. Revisa cada resultado antes de guardarlo."
          : "La generación terminó con observaciones.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos generar el borrador.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function discard(resultId: string) {
    await editorialRequest(
      `/api/admin/training/ai/results/${resultId}/discard`,
      { method: "POST" },
    );
    setJob((current) =>
      current
        ? {
            ...current,
            results: current.results.map((item) =>
              item.id === resultId ? { ...item, status: "discarded" } : item,
            ),
          }
        : current,
    );
  }

  async function regenerate(resultId: string) {
    setBusy(true);
    setStatus("Regenerando la propuesta…");
    try {
      const regenerated = await editorialRequest<Job>(
        `/api/admin/training/ai/results/${resultId}/regenerate`,
        { method: "POST", body: JSON.stringify(payload(getValues())) },
      );
      setJob(regenerated);
      setEditedOutputs({});
      setEstimate(null);
      setStatus(
        "Nueva propuesta generada. La anterior permanece en auditoría.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos regenerar la propuesta.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveExercise(result: AIResult) {
    const values = getValues();
    const output = editedOutputs[result.id] ?? result.output;
    const type = String(output.type);
    if (
      [
        "open_response",
        "guided_builder",
        "decision_justification",
        "reflection",
      ].includes(type)
    ) {
      setStatus(
        "Genera y vincula una rúbrica antes de guardar este ejercicio abierto.",
      );
      return;
    }
    try {
      await editorialRequest(
        `/api/admin/training/ai/results/${result.id}/save-draft`,
        {
          method: "POST",
          body: JSON.stringify({
            entityType: "exercise",
            draft: {
              title: output.internalTitle,
              type,
              skillId: values.skillId,
              conceptId: values.conceptId,
              prompt: output.prompt,
              instruction: output.instruction,
              difficulty: output.difficulty,
              estimatedSeconds: output.estimatedSeconds,
              hint: output.hint,
              explanation: output.explanation,
              content: output.content,
              evaluationConfig: output.evaluationConfig,
              evaluationMode: "deterministic",
              compliance: {
                ownWords: true,
                noLongExcerpts: true,
                citationsIdentified: true,
                examplesAuthorized: true,
              },
              changeReason: "Borrador generado con asistencia editorial de IA",
            },
          }),
        },
      );
      setJob((current) =>
        current
          ? {
              ...current,
              results: current.results.map((item) =>
                item.id === result.id ? { ...item, status: "saved" } : item,
              ),
            }
          : current,
      );
      setStatus(
        "Borrador guardado. Aún requiere previsualización y revisión humana.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos guardar el borrador.",
      );
    }
  }

  async function saveStructuredDraft(result: AIResult) {
    const values = getValues();
    const title = String(
      result.output.name ?? result.output.title ?? "borrador-editorial",
    );
    const body =
      result.result_type === "suggest_rubric"
        ? {
            entityType: "rubric",
            slug: `${slugify(title)}-${result.id.slice(0, 8)}`,
            rubric: result.output,
          }
        : {
            entityType: "template",
            slug: `${slugify(title)}-${result.id.slice(0, 8)}`,
            categoryId: values.categoryId,
            difficulty: values.difficulty,
            template: result.output,
          };
    try {
      await editorialRequest(
        `/api/admin/training/ai/results/${result.id}/save-draft`,
        { method: "POST", body: JSON.stringify(body) },
      );
      setJob((current) =>
        current
          ? {
              ...current,
              results: current.results.map((item) =>
                item.id === result.id ? { ...item, status: "saved" } : item,
              ),
            }
          : current,
      );
      setStatus(
        "Borrador guardado. Debe pasar por previsualización y revisión humana.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "No pudimos guardar el borrador.",
      );
    }
  }

  function updateExerciseOutput(
    result: AIResult,
    field: string,
    value: string,
  ) {
    setEditedOutputs((current) => ({
      ...current,
      [result.id]: {
        ...(current[result.id] ?? result.output),
        [field]: value,
      },
    }));
  }

  const needsExerciseId = task === "generate_variations";
  const needsPrompt = [
    "generate_distractors",
    "improve_feedback",
    "suggest_rubric",
    "review_exercise",
    "suggest_classification",
  ].includes(task);
  const needsTaxonomy = [
    "generate_exercises",
    "generate_distractors",
    "improve_feedback",
    "suggest_rubric",
    "review_exercise",
    "suggest_template",
  ].includes(task);

  return (
    <div className="pb-12">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-bold text-violet-700">CEOTECA Training</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">
          Asistencia editorial con IA
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Genera propuestas estructuradas sin perder el control editorial.
          Ningún resultado se publica automáticamente.
        </p>
      </header>

      {metadata && !metadata.editorialAI.enabled ? (
        <div className="mt-6 rounded-[8px] border border-amber-300 bg-amber-50 p-4 text-amber-950">
          La asistencia editorial con IA no está disponible en este entorno. El
          editor manual sigue funcionando.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <nav
          className="grid content-start gap-2"
          aria-label="Herramientas editoriales con IA"
        >
          {tasks.map((item) => (
            <label
              className={`cursor-pointer rounded-[8px] border p-4 ${task === item.value ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white"}`}
              key={item.value}
            >
              <input
                className="sr-only"
                type="radio"
                value={item.value}
                {...register("task")}
              />
              <span className="block font-black">{item.label}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">
                {item.description}
              </span>
            </label>
          ))}
        </nav>

        <div className="min-w-0">
          <form
            className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6"
            onSubmit={handleSubmit(prepare)}
          >
            <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-violet-100 text-violet-700">
                <WandSparkles size={21} />
              </span>
              <div>
                <h2 className="text-xl font-black">{selectedTask.label}</h2>
                <p className="text-sm text-slate-600">
                  {selectedTask.description}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {needsTaxonomy ? (
                <>
                  <label className="grid gap-2 font-bold">
                    Categoría
                    <select
                      className={inputClass}
                      {...register("categoryId", {
                        required: task === "generate_exercises",
                      })}
                    >
                      <option value="">Selecciona</option>
                      {metadata?.categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 font-bold">
                    Habilidad
                    <select
                      className={inputClass}
                      {...register("skillId", { required: true })}
                    >
                      <option value="">Selecciona</option>
                      {filteredSkills.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {task !== "suggest_template" ? (
                    <label className="grid gap-2 font-bold">
                      Concepto
                      <select
                        className={inputClass}
                        {...register("conceptId", { required: true })}
                      >
                        <option value="">Selecciona</option>
                        {filteredConcepts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </>
              ) : null}
              {task === "generate_exercises" ? (
                <label className="grid gap-2 font-bold">
                  Libro relacionado (opcional)
                  <select className={inputClass} {...register("bookId")}>
                    <option value="">Sin libro</option>
                    {metadata?.books.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} · {item.author}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {task === "generate_exercises" ? (
                <fieldset className="sm:col-span-2">
                  <legend className="font-bold">Fuente</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <label
                      className={`cursor-pointer rounded-[8px] border px-4 py-3 ${sourceMode === "concept" ? "border-violet-500 bg-violet-50" : "border-slate-300"}`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        value="concept"
                        {...register("sourceMode")}
                      />
                      Contexto editorial
                    </label>
                    <label
                      className={`cursor-pointer rounded-[8px] border px-4 py-3 ${sourceMode === "analysis" ? "border-violet-500 bg-violet-50" : "border-slate-300"}`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        value="analysis"
                        {...register("sourceMode")}
                      />
                      Análisis CEOTECA
                    </label>
                  </div>
                </fieldset>
              ) : null}
              {task === "generate_exercises" && sourceMode === "analysis" ? (
                <fieldset className="grid gap-2 sm:col-span-2">
                  <legend className="font-bold">Secciones autorizadas</legend>
                  {analysisSections.length ? (
                    analysisSections.map((section) => (
                      <label
                        className="flex min-h-11 items-start gap-3 rounded-[8px] border border-slate-200 p-3"
                        key={section.id}
                      >
                        <input
                          className="mt-1 h-5 w-5 accent-violet-600"
                          checked={selectedSections.includes(section.id)}
                          onChange={() =>
                            setSelectedSections((current) =>
                              current.includes(section.id)
                                ? current.filter((id) => id !== section.id)
                                : [...current, section.id],
                            )
                          }
                          type="checkbox"
                        />
                        <span>
                          <strong>{section.title}</strong>
                          <span className="block text-xs font-normal text-slate-500">
                            {section.characterCount} caracteres · se enviará un
                            máximo de 2.500
                          </span>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Selecciona un libro para ver sus secciones.
                    </p>
                  )}
                </fieldset>
              ) : null}
              {needsExerciseId ||
              [
                "generate_distractors",
                "improve_feedback",
                "suggest_rubric",
                "review_exercise",
              ].includes(task) ? (
                <label className="grid gap-2 font-bold">
                  ID del ejercicio {needsExerciseId ? "" : "(opcional)"}
                  <input
                    className={inputClass}
                    {...register("exerciseId", { required: needsExerciseId })}
                  />
                </label>
              ) : null}
              {needsPrompt ? (
                <label className="grid gap-2 font-bold sm:col-span-2">
                  Enunciado o prompt
                  <textarea
                    className={`${inputClass} min-h-24 py-3`}
                    {...register("prompt", { required: true })}
                  />
                </label>
              ) : null}
              {[
                "generate_exercises",
                "suggest_rubric",
                "suggest_template",
              ].includes(task) ? (
                <label className="grid gap-2 font-bold sm:col-span-2">
                  Objetivo de aprendizaje
                  <textarea
                    className={`${inputClass} min-h-20 py-3`}
                    {...register("objective", { required: true })}
                  />
                </label>
              ) : null}
              {[
                "generate_exercises",
                "improve_feedback",
                "review_exercise",
                "suggest_classification",
              ].includes(task) &&
              !(task === "generate_exercises" && sourceMode === "analysis") ? (
                <label className="grid gap-2 font-bold sm:col-span-2">
                  Principio o contexto aprobado
                  <textarea
                    className={`${inputClass} min-h-24 py-3`}
                    {...register("principle", { required: true })}
                  />
                </label>
              ) : null}
              {[
                "generate_distractors",
                "improve_feedback",
                "review_exercise",
                "suggest_classification",
              ].includes(task) ? (
                <label className="grid gap-2 font-bold">
                  Respuesta correcta
                  <input
                    className={inputClass}
                    {...register("correctAnswer", { required: true })}
                  />
                </label>
              ) : null}
              {[
                "generate_exercises",
                "generate_distractors",
                "improve_feedback",
              ].includes(task) ? (
                <label className="grid gap-2 font-bold">
                  Errores frecuentes
                  <textarea
                    className={`${inputClass} py-3`}
                    placeholder="Uno por línea"
                    {...register("commonMistakes")}
                  />
                </label>
              ) : null}
              {task === "improve_feedback" ? (
                <label className="grid gap-2 font-bold sm:col-span-2">
                  Feedback actual
                  <textarea
                    className={`${inputClass} min-h-20 py-3`}
                    {...register("currentFeedback")}
                  />
                </label>
              ) : null}
              {task === "suggest_rubric" ? (
                <>
                  <label className="grid gap-2 font-bold sm:col-span-2">
                    Resultado esperado
                    <textarea
                      className={`${inputClass} min-h-20 py-3`}
                      {...register("expectedOutcome", { required: true })}
                    />
                  </label>
                  <label className="grid gap-2 font-bold sm:col-span-2">
                    Ejemplos aprobados
                    <textarea
                      className={`${inputClass} py-3`}
                      {...register("approvedExamples")}
                    />
                  </label>
                </>
              ) : null}
              {task === "generate_variations" ? (
                <label className="grid gap-2 font-bold">
                  Tipo de variación
                  <select className={inputClass} {...register("variationType")}>
                    <option value="new_context">Contexto distinto</option>
                    <option value="easier">Más fácil</option>
                    <option value="harder">Más difícil</option>
                    <option value="new_sector">Otro sector</option>
                    <option value="entrepreneur">Para emprendedor</option>
                    <option value="salesperson">Para vendedor</option>
                    <option value="student">Para estudiante</option>
                    <option value="leader">Para líder</option>
                  </select>
                </label>
              ) : null}
              {task === "suggest_template" ? (
                <>
                  <label className="grid gap-2 font-bold">
                    Duración (minutos)
                    <input
                      className={inputClass}
                      type="number"
                      {...register("durationMinutes", { valueAsNumber: true })}
                    />
                  </label>
                  <label className="grid gap-2 font-bold">
                    Público
                    <input className={inputClass} {...register("audience")} />
                  </label>
                  <label className="grid gap-2 font-bold">
                    Repaso (%)
                    <input
                      className={inputClass}
                      type="number"
                      {...register("reviewPercentage", { valueAsNumber: true })}
                    />
                  </label>
                  <label className="grid gap-2 font-bold">
                    Plan
                    <select className={inputClass} {...register("plan")}>
                      <option value="free">Gratis</option>
                      <option value="pro">Pro</option>
                      <option value="unlimited">Ilimitado</option>
                      <option value="founder">Fundador</option>
                    </select>
                  </label>
                </>
              ) : null}
              <label className="grid gap-2 font-bold">
                Dificultad
                <select className={inputClass} {...register("difficulty")}>
                  <option value="beginner">Inicial</option>
                  <option value="intermediate">Intermedia</option>
                  <option value="advanced">Avanzada</option>
                </select>
              </label>
              {[
                "generate_exercises",
                "generate_distractors",
                "generate_variations",
                "suggest_template",
              ].includes(task) ? (
                <label className="grid gap-2 font-bold">
                  Cantidad
                  <input
                    className={inputClass}
                    max={5}
                    min={1}
                    type="number"
                    {...register("count", {
                      valueAsNumber: true,
                      min: 1,
                      max: 5,
                    })}
                  />
                </label>
              ) : null}
              {task === "generate_exercises" ? (
                <div className="sm:col-span-2">
                  <p className="font-bold">Formatos</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exerciseTypes.map((type) => (
                      <button
                        className={`min-h-11 rounded-[8px] border px-3 text-sm font-bold ${selectedTypes.includes(type) ? "border-violet-500 bg-violet-50 text-violet-800" : "border-slate-300"}`}
                        key={type}
                        onClick={() =>
                          setSelectedTypes((current) =>
                            current.includes(type)
                              ? current.filter((item) => item !== type)
                              : current.length < 5
                                ? [...current, type]
                                : current,
                          )
                        }
                        type="button"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {task === "generate_exercises" ? (
                <fieldset className="grid gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
                  <legend className="font-black">
                    Confirmaciones de fuente
                  </legend>
                  {[
                    [
                      "copyrightConfirmed",
                      "El contexto es propio o está autorizado.",
                    ],
                    [
                      "noFullBookConfirmed",
                      "No estoy enviando un libro o documento completo.",
                    ],
                    [
                      "noLongQuotesConfirmed",
                      "No estoy solicitando citas extensas.",
                    ],
                  ].map(([name, label]) => (
                    <label
                      className="flex min-h-11 items-center gap-3"
                      key={name}
                    >
                      <input
                        className="h-5 w-5 accent-violet-600"
                        type="checkbox"
                        {...register(name as keyof Form, { required: true })}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </div>

            {Object.keys(errors).length ? (
              <p className="mt-4 text-sm font-bold text-rose-700">
                Completa los campos requeridos y confirma la fuente.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-600">
                Se enviará solo el contexto visible en este formulario.
              </p>
              <button
                className="min-h-11 rounded-[8px] bg-violet-700 px-5 font-bold text-white disabled:opacity-40"
                disabled={!metadata?.editorialAI.enabled}
                type="submit"
              >
                Preparar generación
              </button>
            </div>
          </form>

          {estimate ? (
            <section
              className="mt-5 rounded-[8px] border border-violet-200 bg-violet-50 p-5"
              aria-labelledby="estimate-title"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2
                    className="flex items-center gap-2 font-black"
                    id="estimate-title"
                  >
                    <Coins size={19} /> Estimación antes de generar
                  </h2>
                  <p className="mt-2 text-sm text-slate-700">
                    Hasta {getValues("count")} resultado(s), aproximadamente $
                    {estimate.estimatedCost.toFixed(4)}. Modelo de tarea:{" "}
                    {estimate.modelTier === "economical"
                      ? "económico"
                      : "avanzado"}
                    .
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {estimate.inputTokens + estimate.outputTokens} tokens
                    estimados. La cifra final puede variar.
                  </p>
                </div>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-5 font-bold text-white disabled:opacity-50"
                  disabled={busy}
                  onClick={generate}
                  type="button"
                >
                  {busy ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <WandSparkles size={18} />
                  )}{" "}
                  Confirmar y generar
                </button>
              </div>
            </section>
          ) : null}

          <p
            aria-live="polite"
            className="mt-4 min-h-6 text-sm font-semibold text-slate-700"
          >
            {status}
          </p>

          {job ? (
            <section className="mt-4" aria-labelledby="results-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black" id="results-title">
                    Resultados
                  </h2>
                  <p className="text-sm text-slate-600">
                    Borrador generado con IA. Requiere revisión editorial.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                  {job.prompt_version}
                </span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {job.results.map((result, index) => (
                  <article
                    className={`rounded-[8px] border bg-white p-5 ${result.status === "invalid" ? "border-rose-300" : "border-slate-200"}`}
                    key={result.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-violet-700">
                          Propuesta {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-black">
                          {String(
                            result.output.internalTitle ??
                              result.output.name ??
                              result.output.title ??
                              tasks.find((item) => item.value === task)?.label,
                          )}
                        </h3>
                      </div>
                      {result.status === "valid" ? (
                        <Check className="text-emerald-600" size={20} />
                      ) : result.status === "invalid" ? (
                        <AlertTriangle className="text-rose-600" size={20} />
                      ) : null}
                    </div>
                    {result.validation_issues.length ? (
                      <ul className="mt-3 rounded-[8px] bg-rose-50 p-3 text-sm text-rose-800">
                        {result.validation_issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    ) : null}
                    {result.result_type === "exercise" ? (
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
                        <p className="flex items-center gap-2 text-sm font-black">
                          <PencilLine size={16} /> Edita antes de guardar
                        </p>
                        {[
                          ["internalTitle", "Título interno"],
                          ["instruction", "Instrucción"],
                          ["prompt", "Enunciado"],
                          ["explanation", "Explicación"],
                        ].map(([field, label]) => (
                          <label
                            className="grid gap-1 text-sm font-bold"
                            key={field}
                          >
                            {label}
                            {field === "internalTitle" ? (
                              <input
                                className={inputClass}
                                maxLength={180}
                                onChange={(event) =>
                                  updateExerciseOutput(
                                    result,
                                    field,
                                    event.target.value,
                                  )
                                }
                                value={String(
                                  (editedOutputs[result.id] ?? result.output)[
                                    field
                                  ] ?? "",
                                )}
                              />
                            ) : (
                              <textarea
                                className={`${inputClass} min-h-20 py-3 font-normal`}
                                maxLength={
                                  field === "explanation" ? 1800 : 1000
                                }
                                onChange={(event) =>
                                  updateExerciseOutput(
                                    result,
                                    field,
                                    event.target.value,
                                  )
                                }
                                value={String(
                                  (editedOutputs[result.id] ?? result.output)[
                                    field
                                  ] ?? "",
                                )}
                              />
                            )}
                          </label>
                        ))}
                        <details className="rounded-[8px] border border-slate-200 p-3">
                          <summary className="cursor-pointer text-sm font-bold">
                            Ver estructura completa
                          </summary>
                          <div className="mt-3 max-h-80 overflow-auto">
                            <PreviewValue
                              value={editedOutputs[result.id] ?? result.output}
                            />
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div className="mt-4 max-h-96 overflow-auto border-t border-slate-100 pt-4">
                        <PreviewValue value={result.output} />
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {result.result_type === "exercise" &&
                      result.status !== "invalid" &&
                      result.status !== "saved" &&
                      result.status !== "discarded" ? (
                        <button
                          className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-4 font-bold text-white"
                          onClick={() => saveExercise(result)}
                          type="button"
                        >
                          <Save size={17} /> Guardar borrador
                        </button>
                      ) : null}
                      {["suggest_rubric", "suggest_template"].includes(
                        result.result_type,
                      ) &&
                      result.status !== "saved" &&
                      result.status !== "discarded" ? (
                        <button
                          className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-4 font-bold text-white"
                          onClick={() => saveStructuredDraft(result)}
                          type="button"
                        >
                          <Save size={17} /> Guardar borrador
                        </button>
                      ) : null}
                      {result.status !== "saved" &&
                      result.status !== "discarded" ? (
                        <button
                          className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-slate-300 px-4 font-bold"
                          disabled={busy}
                          onClick={() => regenerate(result.id)}
                          type="button"
                        >
                          <RefreshCw size={17} /> Regenerar
                        </button>
                      ) : null}
                      {result.status !== "saved" &&
                      result.status !== "discarded" ? (
                        <button
                          className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-slate-300 px-4 font-bold"
                          onClick={() => discard(result.id)}
                          type="button"
                        >
                          <Trash2 size={17} /> Descartar
                        </button>
                      ) : null}
                      <span className="self-center text-xs font-bold uppercase text-slate-500">
                        {{
                          valid: "Válido",
                          invalid: "Requiere corrección",
                          saved: "Guardado",
                          discarded: "Descartado",
                        }[result.status] ?? result.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
