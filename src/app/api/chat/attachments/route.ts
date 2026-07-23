import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { getAttachmentRequestUser } from "@/lib/chat/attachments/auth";
import { AttachmentError } from "@/lib/chat/attachments/errors";
import { createChatAttachment } from "@/lib/chat/attachments/service";
import { createChatRepository } from "@/lib/chat/repository";

const fieldsSchema = z.object({
  uploadSessionId: z.string().uuid(),
  clientUploadId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getAttachmentRequestUser(request);
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para adjuntar archivos." }, 401);

  const startedAt = Date.now();
  try {
    const form = await request.formData();
    const parsed = fieldsSchema.safeParse({
      uploadSessionId: form.get("uploadSessionId"),
      clientUploadId: form.get("clientUploadId"),
      conversationId: form.get("conversationId") || undefined,
    });
    const file = form.get("file");
    if (!parsed.success || !(file instanceof File)) {
      return jsonError({ code: "INVALID_INPUT", message: "Selecciona un archivo válido." }, 400);
    }

    const repository = createChatRepository();
    void repository.logEvent({
      userId: user.id,
      bookId: null,
      context: "site",
      eventType: "attachment_upload_started",
      code: "ATTACHMENT_UPLOAD_STARTED",
      metadata: {
        category: file.type.startsWith("image/") ? "image" : "document",
        approximateKilobytes: Math.ceil(file.size / 1024),
        plan: user.plan,
      },
    });
    const attachment = await createChatAttachment({
      userId: user.id,
      plan: user.plan,
      uploadSessionId: parsed.data.uploadSessionId,
      clientUploadId: parsed.data.clientUploadId,
      conversationId: parsed.data.conversationId,
      file,
    });
    void repository.logEvent({
      userId: user.id,
      bookId: null,
      context: "site",
      eventType: "attachment_upload_completed",
      code: "ATTACHMENT_UPLOAD_COMPLETED",
      metadata: {
        category: attachment.category,
        approximateKilobytes: Math.ceil(attachment.sizeBytes / 1024),
        durationMs: Date.now() - startedAt,
        plan: user.plan,
      },
    });
    return jsonData({ attachment }, 201);
  } catch (error) {
    const known = error instanceof AttachmentError
      ? error
      : new AttachmentError("STORAGE_UNAVAILABLE", 503);
    void createChatRepository().logEvent({
      userId: user.id,
      bookId: null,
      context: "site",
      eventType: "attachment_upload_failed",
      code: known.code,
      metadata: { durationMs: Date.now() - startedAt, plan: user.plan },
    });
    return jsonError({ code: known.code, message: known.message }, known.status);
  }
}
