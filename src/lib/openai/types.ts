import type { Book } from "@/types";
import type { ChatConversationMessage } from "@/lib/validation/chat";

export type BookChatInput = {
  book: Book;
  message: string;
  conversation: ChatConversationMessage[];
};

export type BookChatResult = {
  message: string;
};

export interface AIProvider {
  answerBookQuestion(input: BookChatInput): Promise<BookChatResult>;
}
