import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { rubricInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "suggest_rubric",
    schema: rubricInputSchema,
    count: () => 1,
    sourceType: () => "exercise",
    sourceId: (input) => input.exerciseId,
  });
}
