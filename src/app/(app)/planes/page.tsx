import type { Metadata } from "next";

import { PlansGate } from "@/components/onboarding/PlansGate";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Elige tu plan",
  description: "Onboarding de planes de Ceoteca.",
};

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const books = await createBookRepository().list();
  const starterBooks = [...books]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  return <PlansGate books={starterBooks} />;
}
