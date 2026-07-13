import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  const [categories, skills, concepts, books] = await Promise.all([
    access.service
      .from("training_categories")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("sort_order"),
    access.service
      .from("training_skills")
      .select("id,name,slug,category_id")
      .eq("is_active", true)
      .order("name"),
    access.service
      .from("training_concepts")
      .select("id,name,slug,skill_id")
      .eq("is_active", true)
      .order("name"),
    access.service
      .from("books")
      .select("id,title,author")
      .eq("is_published", true)
      .order("title"),
  ]);
  return jsonData({
    categories: categories.data ?? [],
    skills: skills.data ?? [],
    concepts: concepts.data ?? [],
    books: books.data ?? [],
  });
}
