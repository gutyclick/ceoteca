import { TrainingSessionFlow } from "@/components/training/session/TrainingSessionFlow";
export default async function TrainingSessionPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <TrainingSessionFlow sessionId={sessionId} />; }
