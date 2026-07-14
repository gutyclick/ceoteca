import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";

const schema = z
  .object({
    title: z.string().trim().min(6).max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().min(20).max(500),
    categoryId: z.string().uuid(),
    difficulty: z.enum(["fundamentals", "application", "advanced", "expert"]),
    characterName: z.string().trim().min(2).max(80),
    characterBrief: z.string().trim().min(20).max(800),
    learnerGoal: z.string().trim().min(20).max(500),
    openingMessage: z.string().trim().min(5).max(600),
    estimatedMinutes: z.number().int().min(3).max(30),
    maxTurns: z.number().int().min(4).max(40),
    minimumPlan: z.enum(["pro", "unlimited"]),
  })
  .strict();

export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      {
        code: "FORBIDDEN",
        message: "No tienes permiso para consultar escenarios.",
      },
      403,
    );
  const [scenarios, categories] = await Promise.all([
    access.service
      .from("training_roleplay_scenarios")
      .select(
        "id,slug,public_title,short_description,status,level,minimum_plan,current_version,updated_at,training_roleplay_categories(name)",
      )
      .order("updated_at", { ascending: false }),
    access.service
      .from("training_roleplay_categories")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("display_order"),
  ]);
  return jsonData({
    scenarios: scenarios.data ?? [],
    categories: categories.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const access = await requireEditorialAccess(request, "create");
  if (!access)
    return jsonError(
      {
        code: "FORBIDDEN",
        message: "No tienes permiso para crear escenarios.",
      },
      403,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_INPUT", message: "Revisa los campos del escenario." },
      400,
    );
  const input = parsed.data;
  const { data: category } = await access.service
    .from("training_roleplay_categories")
    .select("id,name,slug")
    .eq("id", input.categoryId)
    .maybeSingle();
  if (!category)
    return jsonError(
      { code: "CATEGORY_NOT_FOUND", message: "La categoría no existe." },
      404,
    );
  const { data: scenario, error } = await access.service
    .from("training_roleplay_scenarios")
    .insert({
      slug: input.slug,
      title: input.title,
      description: input.description,
      category: category.name,
      category_id: category.id,
      level: input.difficulty,
      character_name: input.characterName,
      character_brief: input.characterBrief,
      learner_goal: input.learnerGoal,
      opening_message: input.openingMessage,
      is_active: false,
      internal_title: input.title,
      public_title: input.title,
      short_description: input.description,
      status: "draft",
      current_version: 1,
      minimum_plan: input.minimumPlan,
      estimated_minutes: input.estimatedMinutes,
      max_turns: input.maxTurns,
      created_by: access.userId,
    })
    .select("id")
    .single();
  if (error || !scenario)
    return jsonError(
      {
        code: "CREATE_FAILED",
        message:
          error?.code === "23505"
            ? "Ya existe un escenario con ese slug."
            : "No pudimos crear el escenario.",
      },
      409,
    );
  const { error: versionError } = await access.service
    .from("training_roleplay_scenario_versions")
    .insert({
      scenario_id: scenario.id,
      version: 1,
      status: "draft",
      public_config: {
        title: input.title,
        description: input.description,
        characterName: input.characterName,
        learnerGoal: input.learnerGoal,
        openingMessage: input.openingMessage,
        estimatedMinutes: input.estimatedMinutes,
        maxTurns: input.maxTurns,
      },
      character_private_context: {
        characterBrief: input.characterBrief,
        objectives: ["Mantener una conversación realista"],
        hiddenInformation: [],
      },
      state_machine_config: {
        initialPhase: "opening",
        phases: ["opening", "discovery", "tension", "resolution", "closing"],
      },
      safety_rules: {
        ethicalPersuasion: true,
        forbidFraud: true,
        forbidCoercion: true,
      },
      prompt_version: "roleplay-character-v1",
      created_by: access.userId,
    });
  if (versionError) {
    await access.service
      .from("training_roleplay_scenarios")
      .delete()
      .eq("id", scenario.id);
    return jsonError(
      {
        code: "VERSION_CREATE_FAILED",
        message: "No pudimos crear la versión del escenario.",
      },
      500,
    );
  }
  return jsonData({ id: scenario.id }, 201);
}
