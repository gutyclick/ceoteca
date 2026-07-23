import {
  chatAttachmentFormats,
  getChatAttachmentExtension,
  type ChatAttachmentCategory,
  type ChatAttachmentExtension,
  type ChatAttachmentPolicy,
} from "@/config/chat-attachments";
import { AttachmentError } from "@/lib/chat/attachments/errors";

const zipSignature = [0x50, 0x4b, 0x03, 0x04];

export type ValidatedAttachmentFile = {
  extension: ChatAttachmentExtension;
  category: ChatAttachmentCategory;
  mimeType: string;
  originalName: string;
};

function startsWith(buffer: Buffer, bytes: number[], offset = 0) {
  return bytes.every((byte, index) => buffer[index + offset] === byte);
}

function isUtf8Text(buffer: Buffer) {
  if (buffer.includes(0)) return false;
  return !buffer.toString("utf8").includes("\uFFFD");
}

function detectMime(buffer: Buffer, extension: ChatAttachmentExtension) {
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) return "image/webp";
  if (startsWith(buffer, zipSignature) && extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (isUtf8Text(buffer)) {
    if (extension === "csv") return "text/csv";
    if (extension === "md") return "text/markdown";
    return "text/plain";
  }
  return null;
}

export function sanitizeAttachmentName(value: string) {
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "-")
    .trim()
    .slice(0, 240);
  return cleaned || "archivo";
}

export function validateAttachmentBuffer(input: {
  buffer: Buffer;
  browserMime: string;
  filename: string;
  policy: ChatAttachmentPolicy;
}): ValidatedAttachmentFile {
  if (!input.buffer.length) throw new AttachmentError("EMPTY_FILE");
  if (input.buffer.length > input.policy.maxBytesPerFile) {
    throw new AttachmentError("FILE_TOO_LARGE");
  }

  const originalName = sanitizeAttachmentName(input.filename);
  const extension = getChatAttachmentExtension(originalName);
  if (!extension || !input.policy.allowedExtensions.some((allowed) => allowed === extension)) {
    throw new AttachmentError("FORMAT_NOT_ALLOWED");
  }

  const definition = chatAttachmentFormats[extension];
  const allowedMimeTypes: readonly string[] = definition.mimeTypes;
  const detectedMime = detectMime(input.buffer, extension);
  if (!detectedMime || !allowedMimeTypes.includes(detectedMime)) {
    throw new AttachmentError("CORRUPT_FILE");
  }

  if (
    input.browserMime &&
    !allowedMimeTypes.includes(input.browserMime) &&
    !(input.browserMime === "application/octet-stream" && detectedMime)
  ) {
    throw new AttachmentError("CORRUPT_FILE");
  }

  return {
    extension,
    category: definition.category,
    mimeType: detectedMime,
    originalName,
  };
}
