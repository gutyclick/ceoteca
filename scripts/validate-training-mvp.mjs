import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const env = { ...loadEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.",
  );
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const rows = async (query, label) => {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data ?? [];
};
const countBy = (items, key) =>
  Object.fromEntries(
    [...new Set(items.map((item) => item[key]))]
      .sort()
      .map((value) => [
        value,
        items.filter((item) => item[key] === value).length,
      ]),
  );

const categorySlugs = ["marketing-y-marca", "ventas-y-persuasion"];
const categories = await rows(
  db
    .from("training_categories")
    .select("id,slug,name")
    .in("slug", categorySlugs),
  "categorías",
);
assert(categories.length === 2, "Deben existir las dos categorías del MVP.");

const categoryById = new Map(categories.map((item) => [item.id, item.slug]));
const skills = await rows(
  db
    .from("training_skills")
    .select("id,category_id,slug,name,status,is_active")
    .in("category_id", [...categoryById.keys()])
    .eq("status", "published")
    .eq("is_active", true),
  "habilidades",
);
const skillsByCategory = Object.fromEntries(
  categorySlugs.map((slug) => [
    slug,
    skills.filter((skill) => categoryById.get(skill.category_id) === slug),
  ]),
);
const expectedSkillSlugs = {
  "marketing-y-marca": [
    "analizar-jerarquia-visual",
    "crear-propuestas-de-valor",
    "crear-slogans",
    "evaluar-anuncios",
    "evaluar-coherencia-de-marca",
  ],
  "ventas-y-persuasion": [
    "cerrar-con-claridad",
    "defender-precio",
    "descubrir-necesidades",
    "escribir-seguimientos",
    "responder-objeciones",
  ],
};
for (const slug of categorySlugs) {
  assert(
    skillsByCategory[slug].length === 5,
    `${slug} debe tener exactamente 5 habilidades publicadas.`,
  );
  assert(
    JSON.stringify(skillsByCategory[slug].map((item) => item.slug).sort()) ===
      JSON.stringify(expectedSkillSlugs[slug]),
    `${slug} no coincide con las cinco habilidades oficiales.`,
  );
}

const skillById = new Map(skills.map((item) => [item.id, item]));
const concepts = await rows(
  db
    .from("training_concepts")
    .select("id,skill_id,slug,name,status,is_active")
    .in("skill_id", [...skillById.keys()])
    .eq("status", "published")
    .eq("is_active", true),
  "conceptos",
);
const conceptById = new Map(concepts.map((item) => [item.id, item]));
for (const slug of categorySlugs) {
  const skillIds = new Set(skillsByCategory[slug].map((item) => item.id));
  assert(
    concepts.filter((item) => skillIds.has(item.skill_id)).length === 20,
    `${slug} debe tener exactamente 20 conceptos publicados.`,
  );
}

const exercises = await rows(
  db
    .from("training_exercises")
    .select(
      "id,skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,status,cognitive_level,minimum_plan,allowed_plans,preview_allowed,evaluation_mode,visual_alternative,ai_rubric",
    )
    .in("skill_id", [...skillById.keys()])
    .like("title", "MVP%")
    .eq("status", "published"),
  "ejercicios",
);
const exercisesByCategory = Object.fromEntries(
  categorySlugs.map((slug) => {
    const skillIds = new Set(skillsByCategory[slug].map((item) => item.id));
    return [slug, exercises.filter((item) => skillIds.has(item.skill_id))];
  }),
);

const deterministicTypes = new Set([
  "single_choice",
  "multiple_choice",
  "true_false",
  "ordering",
  "scenario",
]);
const visualTypes = new Set([
  "visual_single_choice",
  "visual_comparison",
  "visual_diagnosis",
  "visual_ranking",
]);
const messageTypes = new Set([
  "message_response",
  "message_comparison",
  "objection_response",
  "tone_adjustment",
  "email_rewrite",
  "conversation_diagnosis",
]);
const openTypes = new Set([
  "open_response",
  "guided_builder",
  "decision_justification",
]);
const rendererTypes = new Set([
  ...deterministicTypes,
  ...visualTypes,
  ...messageTypes,
  ...openTypes,
  "flashcard",
  "visual_annotation",
  "reflection",
]);

const marketing = exercisesByCategory["marketing-y-marca"];
const sales = exercisesByCategory["ventas-y-persuasion"];
assert(marketing.length === 50, "Marketing debe tener 50 ejercicios.");
assert(sales.length === 50, "Ventas debe tener 50 ejercicios.");
assert(
  marketing.filter((item) => deterministicTypes.has(item.type)).length === 30,
  "Marketing debe tener 30 ejercicios deterministas.",
);
assert(
  marketing.filter((item) => visualTypes.has(item.type)).length === 10,
  "Marketing debe tener 10 ejercicios visuales.",
);
assert(
  marketing.filter((item) => openTypes.has(item.type)).length === 10,
  "Marketing debe tener 10 respuestas abiertas o builders.",
);
assert(
  sales.filter((item) => deterministicTypes.has(item.type)).length === 30,
  "Ventas debe tener 30 ejercicios deterministas.",
);
assert(
  sales.filter((item) => messageTypes.has(item.type)).length === 12,
  "Ventas debe tener 12 ejercicios de mensajes.",
);
assert(
  sales.filter((item) => openTypes.has(item.type)).length === 8,
  "Ventas debe tener 8 respuestas abiertas.",
);

const promptCounts = new Map();
for (const exercise of exercises) {
  const skill = skillById.get(exercise.skill_id);
  const concept = conceptById.get(exercise.concept_id);
  assert(Boolean(skill), `${exercise.id}: ejercicio sin habilidad válida.`);
  assert(
    Boolean(concept) && concept.skill_id === exercise.skill_id,
    `${exercise.id}: concepto inexistente o de otra habilidad.`,
  );
  assert(rendererTypes.has(exercise.type), `${exercise.id}: renderer ausente.`);
  for (const field of [
    "title",
    "prompt",
    "instruction",
    "explanation",
    "cognitive_level",
    "minimum_plan",
    "evaluation_mode",
  ]) {
    assert(Boolean(exercise[field]), `${exercise.id}: falta ${field}.`);
  }
  assert(exercise.estimated_seconds > 0, `${exercise.id}: duración inválida.`);
  assert(
    Array.isArray(exercise.allowed_plans) &&
      exercise.allowed_plans.includes(exercise.minimum_plan),
    `${exercise.id}: planes inconsistentes.`,
  );
  assert(
    Boolean(exercise.content?.objective),
    `${exercise.id}: falta objetivo.`,
  );
  assert(
    Array.isArray(exercise.content?.commonErrors) &&
      exercise.content.commonErrors.length > 0,
    `${exercise.id}: faltan errores frecuentes.`,
  );
  assert(
    Boolean(exercise.content?.editorialSource),
    `${exercise.id}: falta fuente editorial.`,
  );
  promptCounts.set(
    exercise.prompt,
    (promptCounts.get(exercise.prompt) ?? 0) + 1,
  );
}
for (const [prompt, count] of promptCounts) {
  assert(
    count === 1,
    `Prompt duplicado ${count} veces: ${prompt.slice(0, 70)}`,
  );
}

const rules = await rows(
  db
    .from("training_exercise_evaluation_rules")
    .select("exercise_id,evaluation_config")
    .in(
      "exercise_id",
      exercises.map((item) => item.id),
    ),
  "reglas de evaluación",
);
const ruleByExercise = new Map(
  rules.map((item) => [item.exercise_id, item.evaluation_config]),
);
for (const exercise of exercises) {
  if (deterministicTypes.has(exercise.type) || visualTypes.has(exercise.type)) {
    const rule = ruleByExercise.get(exercise.id);
    assert(Boolean(rule), `${exercise.id}: falta respuesta determinista.`);
    const expectedKey =
      exercise.type === "true_false"
        ? "correctValue"
        : exercise.type === "ordering" || exercise.type === "visual_ranking"
          ? "correctOrder"
          : exercise.type === "multiple_choice"
            ? "correctOptionIds"
            : "correctOptionId";
    assert(
      rule && Object.hasOwn(rule, expectedKey),
      `${exercise.id}: la regla no contiene ${expectedKey}.`,
    );
  }
  if (messageTypes.has(exercise.type) || openTypes.has(exercise.type)) {
    assert(
      Array.isArray(exercise.ai_rubric?.criteria) &&
        exercise.ai_rubric.criteria.length >= 3,
      `${exercise.id}: rúbrica abierta incompleta.`,
    );
  }
}

const visualExercises = marketing.filter((item) => visualTypes.has(item.type));
const exerciseAssets = await rows(
  db
    .from("training_exercise_assets")
    .select("exercise_id,asset_id,label,sort_order")
    .in(
      "exercise_id",
      visualExercises.map((item) => item.id),
    ),
  "relaciones de assets",
);
const assetIds = [...new Set(exerciseAssets.map((item) => item.asset_id))];
const assets = await rows(
  db
    .from("training_visual_assets")
    .select("id,storage_path,alt_text,source_type,copyright_status")
    .in("id", assetIds),
  "assets visuales",
);
assert(assets.length === 10, "Deben existir 10 assets visuales originales.");
for (const asset of assets) {
  assert(asset.source_type === "original", `${asset.id}: asset no original.`);
  assert(
    asset.copyright_status === "approved",
    `${asset.id}: asset no aprobado.`,
  );
  assert(asset.alt_text?.length >= 8, `${asset.id}: alt text incompleto.`);
  assert(
    asset.storage_path.startsWith("/images/training/mvp/"),
    `${asset.id}: ruta visual fuera del paquete.`,
  );
}
for (const exercise of visualExercises) {
  const relationCount = exerciseAssets.filter(
    (item) => item.exercise_id === exercise.id,
  ).length;
  assert(relationCount >= 1, `${exercise.id}: ejercicio visual sin asset.`);
  assert(
    exercise.visual_alternative?.length >= 8,
    `${exercise.id}: falta alternativa visual accesible.`,
  );
}

const pathSlugs = ["construye-una-marca-fuerte", "aprende-a-vender"];
const paths = await rows(
  db
    .from("training_learning_paths")
    .select("id,slug,name,status,minimum_plan")
    .in("slug", pathSlugs),
  "rutas",
);
assert(paths.length === 2, "Deben existir las dos rutas del MVP.");
for (const path of paths) {
  assert(path.status === "published", `${path.slug}: ruta no publicada.`);
}
const pathById = new Map(paths.map((item) => [item.id, item]));
const modules = await rows(
  db
    .from("training_learning_path_modules")
    .select("id,path_id,title,sort_order,status,minimum_plan")
    .in("path_id", [...pathById.keys()])
    .order("sort_order"),
  "módulos",
);
for (const path of paths) {
  assert(
    modules.filter((item) => item.path_id === path.id).length === 10,
    `${path.slug}: debe tener 10 módulos.`,
  );
}
const moduleById = new Map(modules.map((item) => [item.id, item]));
const items = await rows(
  db
    .from("training_learning_path_module_items")
    .select(
      "id,module_id,item_type,exercise_id,sort_order,minimum_plan,preview_allowed",
    )
    .in("module_id", [...moduleById.keys()]),
  "actividades de ruta",
);
const exerciseById = new Map(exercises.map((item) => [item.id, item]));
const expectedLevels = [
  "recognition",
  "understanding",
  "application",
  "application",
  "analysis",
  "analysis",
  "analysis",
  "transfer",
  "transfer",
  "synthesis",
];
for (const pathModule of modules) {
  const moduleItems = items.filter((item) => item.module_id === pathModule.id);
  assert(
    moduleItems.length >= 3 && moduleItems.length <= 6,
    `${pathModule.title}: debe tener entre 3 y 6 actividades.`,
  );
  for (const item of moduleItems) {
    const exercise = exerciseById.get(item.exercise_id);
    assert(
      Boolean(exercise),
      `${pathModule.title}: actividad sin ejercicio MVP.`,
    );
    assert(
      exercise?.cognitive_level === expectedLevels[pathModule.sort_order - 1],
      `${pathModule.title}: ${item.id} usa ${exercise?.cognitive_level ?? "ningún nivel"} en lugar de ${expectedLevels[pathModule.sort_order - 1]} (${item.minimum_plan}).`,
    );
    if (pathModule.sort_order === 1 && item.sort_order <= 2) {
      assert(
        item.minimum_plan === "free" && exercise?.minimum_plan === "free",
        `${pathModule.title}: preview Free bloqueada.`,
      );
    }
  }
}

const roleplays = await rows(
  db
    .from("training_roleplay_scenarios")
    .select("id,slug,status,is_active,minimum_plan,level")
    .like("slug", "mvp-%"),
  "role-plays",
);
assert(roleplays.length === 4, "Deben existir cuatro role-plays preparados.");
for (const roleplay of roleplays) {
  assert(
    roleplay.status === "draft" && roleplay.is_active === false,
    `${roleplay.slug}: debe permanecer desactivado y en borrador.`,
  );
  assert(roleplay.minimum_plan !== "free", `${roleplay.slug}: acceso Free.`);
}

const freeExercises = exercises.filter((item) => item.minimum_plan === "free");
assert(freeExercises.length === 10, "Free debe tener 10 ejercicios completos.");
assert(
  freeExercises.some((item) =>
    skillsByCategory["marketing-y-marca"].some(
      (skill) => skill.id === item.skill_id,
    ),
  ) &&
    freeExercises.some((item) =>
      skillsByCategory["ventas-y-persuasion"].some(
        (skill) => skill.id === item.skill_id,
      ),
    ),
  "Free debe incluir ambas categorías.",
);

const report = {
  categories: categories.length,
  skills: skills.length,
  concepts: concepts.length,
  exercises: {
    marketing: marketing.length,
    sales: sales.length,
    free: freeExercises.length,
    types: countBy(exercises, "type"),
  },
  routes: paths.length,
  modules: modules.length,
  routeItems: items.length,
  assets: assets.length,
  roleplaysDraft: roleplays.length,
};

if (errors.length > 0) {
  console.error(JSON.stringify({ ok: false, errors, report }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, report }, null, 2));
}
