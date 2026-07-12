import { TrainingResultsView } from "@/components/training/session/TrainingResultsView";
export default async function TrainingResultsPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <TrainingResultsView sessionId={sessionId} />; }
