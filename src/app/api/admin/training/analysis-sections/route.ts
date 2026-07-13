import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
const schema = z.string().uuid();
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  const parsed = schema.safeParse(request.nextUrl.searchParams.get("bookId"));
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_BOOK", message: "Selecciona un análisis válido." },
      400,
    );
  const { data } = await access.service
    .from("book_sections")
    .select("id,title,section_type,content,position")
    .eq("book_id", parsed.data)
    .order("position");
  return jsonData(
    (data ?? []).map((section) => {
      const content = section.content as
        | Record<string, unknown>
        | string
        | null;
      const text =
        typeof content === "string"
          ? content
          : typeof content?.content === "string"
            ? content.content
            : JSON.stringify(content ?? {});
      return {
        id: section.id,
        title: section.title,
        sectionType: section.section_type,
        content: text.slice(0, 2500),
        characterCount: text.length,
      };
    }),
  );
}
