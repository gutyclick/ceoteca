import type { Metadata } from "next";

import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Chat IA",
  description: "Conversa con CEO sobre tu biblioteca y los análisis de Ceoteca.",
};

export default async function ChatPage() {
  const books = (await createBookRepository().list()).filter((book) => book.isPublished);

  return <ChatWorkspace books={books} />;
}
