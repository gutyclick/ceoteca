import type { ChatAttachmentCategory } from "@/config/chat-attachments";
import type { Json } from "@/lib/supabase/database.types";

export const chatAttachmentStatuses = [
  "pending",
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleted",
] as const;
export const chatAttachmentExtractionStatuses = [
  "pending",
  "processing",
  "ready",
  "failed",
  "not_applicable",
] as const;

export type ChatAttachmentStatus = (typeof chatAttachmentStatuses)[number];
export type ChatAttachmentExtractionStatus =
  (typeof chatAttachmentExtractionStatuses)[number];

export type ChatAttachment = {
  id: string;
  conversationId: string | null;
  messageId: string | null;
  uploadSessionId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: ChatAttachmentCategory;
  status: ChatAttachmentStatus;
  extractionStatus: ChatAttachmentExtractionStatus;
  createdAt: string;
  metadata: Json;
};

export type ChatAttachmentPart = {
  type: "attachment";
  attachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category: ChatAttachmentCategory;
  extractionStatus: ChatAttachmentExtractionStatus;
  truncated?: boolean;
};

export type ChatAttachmentContext = ChatAttachmentPart & {
  extractedContent?: string;
  imageDataUrl?: string;
  processingNote?: string;
};

export function toAttachmentPart(
  attachment: ChatAttachment,
  truncated = false,
): ChatAttachmentPart {
  return {
    type: "attachment",
    attachmentId: attachment.id,
    filename: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    category: attachment.category,
    extractionStatus: attachment.extractionStatus,
    ...(truncated ? { truncated: true } : {}),
  };
}
