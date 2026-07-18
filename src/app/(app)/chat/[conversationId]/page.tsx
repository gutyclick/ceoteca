import type { Metadata } from "next";

import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Chat con CEO",
  description: "Continúa una conversación con CEO en Ceoteca.",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const books = (await createBookRepository().list()).filter((book) => book.isPublished);

  return <ChatWorkspace books={books} initialConversationId={conversationId} />;
}
