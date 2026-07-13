import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { classificationInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "suggest_classification",
    schema: classificationInputSchema,
    action: "ai_review",
    count: () => 1,
  });
}
