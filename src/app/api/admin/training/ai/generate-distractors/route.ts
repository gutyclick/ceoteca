import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { generateDistractorsInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "generate_distractors",
    schema: generateDistractorsInputSchema,
    count: (input) => input.count,
    sourceType: () => "exercise",
    sourceId: (input) => input.exerciseId,
  });
}
