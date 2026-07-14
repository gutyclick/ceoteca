import { RoleplayPreparationView } from "@/components/training/roleplay/RoleplayPreparationView";
export default async function RoleplayScenarioPage({
  params,
}: {
  params: Promise<{ scenarioSlug: string }>;
}) {
  return <RoleplayPreparationView slug={(await params).scenarioSlug} />;
}
