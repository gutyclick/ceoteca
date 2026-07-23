import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { getChatAttachmentPolicy } from "@/config/chat-attachments";
import { AttachmentError } from "@/lib/chat/attachments/errors";
import {
  sanitizeAttachmentName,
  validateAttachmentBuffer,
} from "@/lib/chat/attachments/validation";

describe("chat attachment validation", () => {
  const policy = getChatAttachmentPolicy("pro");

  it("accepts a PDF only when its signature matches", () => {
    const result = validateAttachmentBuffer({
      buffer: Buffer.from("%PDF-1.7\ncontenido"),
      browserMime: "application/pdf",
      filename: "informe.pdf",
      policy,
    });

    expect(result).toMatchObject({
      category: "document",
      extension: "pdf",
      mimeType: "application/pdf",
    });
  });

  it("rejects content disguised with an allowed image extension", () => {
    expect(() =>
      validateAttachmentBuffer({
        buffer: Buffer.from("esto no es una imagen"),
        browserMime: "image/png",
        filename: "captura.png",
        policy,
      }),
    ).toThrowError(AttachmentError);
  });

  it("removes path separators and control characters from display names", () => {
    expect(sanitizeAttachmentName("../carpeta\\\u0000reporte.pdf")).toBe(
      "..-carpeta-reporte.pdf",
    );
  });

  it("keeps attachments disabled for the free plan", () => {
    expect(getChatAttachmentPolicy("free")).toMatchObject({
      enabled: false,
      maxFilesPerMessage: 0,
    });
  });
});
