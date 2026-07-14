import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
const schema = z
  .object({ action: z.enum(["submit_review", "publish", "archive"]) })
  .strict();
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> },
) {
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return jsonError(
      { code: "INVALID_INPUT", message: "Acción no válida." },
      400,
    );
  const permission =
    body.data.action === "publish"
      ? "publish"
      : body.data.action === "archive"
        ? "archive"
        : "submit_review";
  const access = await requireEditorialAccess(request, permission);
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes permiso para esta acción." },
      403,
    );
  const { scenarioId } = await params;
  const { data: scenario } = await access.service
    .from("training_roleplay_scenarios")
    .select("*,training_roleplay_scenario_versions(*)")
    .eq("id", scenarioId)
    .maybeSingle();
  if (!scenario)
    return jsonError(
      { code: "NOT_FOUND", message: "No encontramos el escenario." },
      404,
    );
  const versions = Array.isArray(scenario.training_roleplay_scenario_versions)
    ? scenario.training_roleplay_scenario_versions
    : [];
  const version = versions.find(
    (item: { version: number }) => item.version === scenario.current_version,
  );
  const errors: string[] = [];
  if (!scenario.character_name) errors.push("Falta el personaje.");
  if (!scenario.learner_goal) errors.push("Falta el objetivo.");
  if (!scenario.opening_message) errors.push("Falta el mensaje inicial.");
  if (!version?.character_private_context)
    errors.push("Falta el contexto privado.");
  if (!version?.safety_rules) errors.push("Faltan reglas de seguridad.");
  if (body.data.action === "publish" && !version?.rubric_version_id)
    errors.push("Falta asociar una rúbrica publicada.");
  if (errors.length)
    return jsonError(
      { code: "VALIDATION_FAILED", message: errors.join(" ") },
      422,
    );
  const status =
    body.data.action === "submit_review"
      ? "review"
      : body.data.action === "publish"
        ? "published"
        : "archived";
  if (body.data.action === "publish") {
    await access.service
      .from("training_roleplay_scenario_versions")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_by: access.userId,
      })
      .eq("id", version.id);
  }
  await access.service
    .from("training_roleplay_scenarios")
    .update({
      status,
      is_active: status === "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", scenarioId);
  return jsonData({ id: scenarioId, status });
}
