import { RoleplaySessionView } from "@/components/training/roleplay/RoleplaySessionView";
export default async function RoleplaySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return <RoleplaySessionView sessionId={(await params).sessionId} />;
}
