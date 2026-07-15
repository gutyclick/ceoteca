import { redirect } from "next/navigation";

export default async function TrainingPathAliasPage({ params }: { params: Promise<{ pathSlug: string }> }) {
  redirect(`/ejercicios/rutas/${encodeURIComponent((await params).pathSlug)}`);
}
