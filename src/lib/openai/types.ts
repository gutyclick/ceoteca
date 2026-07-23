import type { Book } from "@/types";
import type { ChatAttachmentContext } from "@/lib/chat/attachments/model";
import type { ChatConversationMessage } from "@/lib/validation/chat";

export type BookChatInput = {
  book: Book;
  message: string;
  conversation: ChatConversationMessage[];
  attachments?: ChatAttachmentContext[];
};

export type SiteChatInput = {
  books: Book[];
  message: string;
  conversation: ChatConversationMessage[];
  attachments?: ChatAttachmentContext[];
};

export type BookChatResult = {
  message: string;
};

export interface AIProvider {
  answerBookQuestion(input: BookChatInput): Promise<BookChatResult>;
  answerSiteQuestion(input: SiteChatInput): Promise<BookChatResult>;
  streamBookQuestion(input: BookChatInput, signal?: AbortSignal): AsyncIterable<string>;
  streamSiteQuestion(input: SiteChatInput, signal?: AbortSignal): AsyncIterable<string>;
}
