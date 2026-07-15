import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";
import { getTrainingNavigationService } from "@/lib/training/navigation-service";
import {
  trainingCategoryFiltersSchema,
  trainingCategoryPageFiltersSchema,
} from "@/lib/training/navigation-schemas";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { taxonomySlugSchema } from "@/lib/training/taxonomy-schemas";
import type { TrainingPlan } from "@/lib/training/taxonomy-model";

const viewSchema = z.enum(["home", "categories", "category", "skill"]);
function asTrainingPlan(plan: string): TrainingPlan {
  return plan === "unlimited"
    ? "unlimited"
    : plan === "pro" || plan === "founder"
      ? "pro"
      : "free";
}
export async function GET(request: NextRequest) {
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para consultar Training.",
      },
      401,
    );
  const url = new URL(request.url);
  const view = viewSchema.safeParse(url.searchParams.get("view") ?? "home");
  if (!view.success)
    return jsonError(
      { code: "INVALID_VIEW", message: "La vista solicitada no es válida." },
      400,
    );
  const subscription = await getEffectiveSubscriptionForUser(auth.user.id);
  const plan = asTrainingPlan(subscription.plan);
  const service = getTrainingNavigationService();
  if (view.data === "home")
    return jsonData(await service.getHome(auth.user.id, plan));
  if (view.data === "categories") {
    const filters = trainingCategoryFiltersSchema.parse(
      Object.fromEntries(url.searchParams),
    );
    return jsonData(await service.getCategories(auth.user.id, plan, filters));
  }
  const slug = taxonomySlugSchema.safeParse(url.searchParams.get("slug"));
  if (!slug.success)
    return jsonError(
      {
        code: "INVALID_SLUG",
        message: "El contenido solicitado no es válido.",
      },
      400,
    );
  if (view.data === "category") {
    const filters = trainingCategoryPageFiltersSchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const data = await service.getCategoryPage(
      auth.user.id,
      plan,
      slug.data,
      filters,
    );
    return data
      ? jsonData(data)
      : jsonError(
          { code: "NOT_FOUND", message: "El contenido no está disponible." },
          404,
        );
  }
  const data = await service.getSkillPage(auth.user.id, plan, slug.data);
  return data
    ? jsonData(data)
    : jsonError(
        { code: "NOT_FOUND", message: "El contenido no está disponible." },
        404,
      );
}
