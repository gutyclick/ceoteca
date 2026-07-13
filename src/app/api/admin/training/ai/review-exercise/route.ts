import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { reviewExerciseInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "review_exercise",
    schema: reviewExerciseInputSchema,
    action: "ai_review",
    count: () => 1,
    sourceType: () => "exercise",
    sourceId: (input) => input.exerciseId,
  });
}
