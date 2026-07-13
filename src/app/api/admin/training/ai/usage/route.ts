import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { EditorialGenerationService } from "@/lib/training/editorial-ai-service";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  return jsonData(
    await new EditorialGenerationService(access.service).usage(
      access.userId,
      access.role === "admin",
    ),
  );
}
