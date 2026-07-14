import { RoleplayResultsView } from "@/components/training/roleplay/RoleplayResultsView";
export default async function RoleplayResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return <RoleplayResultsView sessionId={(await params).sessionId} />;
}
