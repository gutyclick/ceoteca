import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso al panel editorial." },
      403,
    );
  const [exercises, templates, reviews, audit] = await Promise.all([
    access.service.from("training_exercises").select("status"),
    access.service
      .from("training_templates")
      .select("id")
      .eq("is_active", true),
    access.service
      .from("training_editorial_reviews")
      .select("id")
      .eq("status", "pending"),
    access.service
      .from("training_editorial_audit_log")
      .select("action,entity_type,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const rows = exercises.data ?? [];
  return jsonData({
    role: access.role,
    total: rows.length,
    draft: rows.filter((item) => item.status === "draft").length,
    inReview: rows.filter((item) => item.status === "in_review").length,
    published: rows.filter((item) => item.status === "published").length,
    archived: rows.filter((item) => item.status === "archived").length,
    activeTemplates: templates.data?.length ?? 0,
    pendingReviews: reviews.data?.length ?? 0,
    activity: audit.data ?? [],
  });
}
