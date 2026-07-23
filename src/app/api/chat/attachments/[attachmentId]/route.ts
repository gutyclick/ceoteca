import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { getAttachmentRequestUser } from "@/lib/chat/attachments/auth";
import { AttachmentError } from "@/lib/chat/attachments/errors";
import {
  createAttachmentSignedUrl,
  removeTemporaryAttachment,
} from "@/lib/chat/attachments/service";
import { createChatRepository } from "@/lib/chat/repository";

const idSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const user = await getAttachmentRequestUser(request);
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para abrir el archivo." }, 401);
  const { attachmentId } = await context.params;
  if (!idSchema.safeParse(attachmentId).success) {
    return jsonError({ code: "INVALID_INPUT", message: "El archivo no es válido." }, 400);
  }
  try {
    return jsonData(await createAttachmentSignedUrl(user.id, attachmentId));
  } catch (error) {
    const known = error instanceof AttachmentError ? error : new AttachmentError("STORAGE_UNAVAILABLE", 503);
    return jsonError({ code: known.code, message: known.message }, known.status);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const user = await getAttachmentRequestUser(request);
  if (!user) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para eliminar el archivo." }, 401);
  const { attachmentId } = await context.params;
  if (!idSchema.safeParse(attachmentId).success) {
    return jsonError({ code: "INVALID_INPUT", message: "El archivo no es válido." }, 400);
  }
  try {
    await removeTemporaryAttachment(user.id, attachmentId);
    void createChatRepository().logEvent({
      userId: user.id,
      bookId: null,
      context: "site",
      eventType: "attachment_removed",
      code: "ATTACHMENT_REMOVED",
      metadata: { plan: user.plan },
    });
    return jsonData({ removed: true });
  } catch (error) {
    const known = error instanceof AttachmentError ? error : new AttachmentError("STORAGE_UNAVAILABLE", 503);
    return jsonError({ code: known.code, message: known.message }, known.status);
  }
}
