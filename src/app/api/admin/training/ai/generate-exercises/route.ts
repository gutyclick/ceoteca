import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { generateExercisesInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "generate_exercises",
    schema: generateExercisesInputSchema,
    count: (input) => input.count,
    sourceType: (input) => input.sourceType,
    sourceId: (input) => input.sourceId,
  });
}
