import { RoleplayPreparationView } from "@/components/training/roleplay/RoleplayPreparationView";
export default async function RoleplayScenarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioSlug: string }>;
  searchParams: Promise<{ rutaItem?: string }>;
}) {
  return <RoleplayPreparationView pathItemId={(await searchParams).rutaItem} slug={(await params).scenarioSlug} />;
}
