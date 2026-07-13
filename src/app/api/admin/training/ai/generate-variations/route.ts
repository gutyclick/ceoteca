import { NextRequest } from "next/server";
import { handleEditorialGeneration } from "@/lib/training/editorial-ai-route";
import { variationInputSchema } from "@/lib/training/editorial-ai-schemas";
export async function POST(request: NextRequest) {
  return handleEditorialGeneration(request, {
    jobType: "generate_variations",
    schema: variationInputSchema,
    count: (input) => input.count ?? 1,
    sourceType: () => "exercise",
    sourceId: (input) => input.exerciseId,
  });
}
