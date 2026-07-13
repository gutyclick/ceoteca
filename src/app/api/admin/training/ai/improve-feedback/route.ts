import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { improveFeedbackInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "improve_feedback",
    schema: improveFeedbackInputSchema,
    count: () => 1,
    sourceType: () => "exercise",
    sourceId: (input) => input.exerciseId,
  });
}
