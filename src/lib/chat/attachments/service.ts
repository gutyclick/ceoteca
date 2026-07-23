import "server-only";

import { randomUUID } from "node:crypto";

import {
  chatAttachmentProcessingLimits,
  getChatAttachmentPolicy,
} from "@/config/chat-attachments";
import type { PlanKey } from "@/config/plans";
import { AttachmentError } from "@/lib/chat/attachments/errors";
import { processAttachment } from "@/lib/chat/attachments/extraction";
import {
  toAttachmentPart,
  type ChatAttachment,
  type ChatAttachmentContext,
} from "@/lib/chat/attachments/model";
import { validateAttachmentBuffer } from "@/lib/chat/attachments/validation";
import { getUserConversation } from "@/lib/chat/conversation-service";
import { clientEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

const bucket = "chat-attachments";
type AttachmentRow = Database["public"]["Tables"]["chat_attachments"]["Row"];

const demoAttachments = new Map<
  string,
  ChatAttachment & { userId: string; clientUploadId: string; content: string }
>();

function mapAttachment(row: AttachmentRow): ChatAttachment {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    uploadSessionId: row.upload_session_id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    category: row.category,
    status: row.status,
    extractionStatus: row.extraction_status,
    createdAt: row.created_at,
    metadata: row.metadata,
  };
}

function expiresAt(plan: PlanKey) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + getChatAttachmentPolicy(plan).retentionDays);
  return date.toISOString();
}

export async function createChatAttachment(input: {
  userId: string;
  plan: PlanKey;
  uploadSessionId: string;
  clientUploadId: string;
  conversationId?: string;
  file: File;
}) {
  const policy = getChatAttachmentPolicy(input.plan);
  if (!policy.enabled) throw new AttachmentError("ACCESS_DENIED", 403, "Los archivos están disponibles desde el plan Pro.");

  if (input.conversationId) {
    const conversation = await getUserConversation(input.userId, input.conversationId);
    if (!conversation) throw new AttachmentError("ACCESS_DENIED", 403);
  }

  const rawBuffer = Buffer.from(await input.file.arrayBuffer());
  const validated = validateAttachmentBuffer({
    buffer: rawBuffer,
    browserMime: input.file.type,
    filename: input.file.name,
    policy,
  });

  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const existing = [...demoAttachments.values()].find(
      (attachment) =>
        attachment.userId === input.userId &&
        attachment.clientUploadId === input.clientUploadId,
    );
    if (existing) return existing;
    const id = randomUUID();
    const now = new Date().toISOString();
    const attachment: ChatAttachment & {
      userId: string;
      clientUploadId: string;
      content: string;
    } = {
      id,
      userId: input.userId,
      clientUploadId: input.clientUploadId,
      conversationId: input.conversationId ?? null,
      messageId: null,
      uploadSessionId: input.uploadSessionId,
      originalName: validated.originalName,
      mimeType: validated.mimeType,
      sizeBytes: rawBuffer.length,
      category: validated.category,
      status: "ready",
      extractionStatus: validated.category === "image" ? "not_applicable" : "ready",
      createdAt: now,
      metadata: { demo: true, processingSimulated: true },
      content: "",
    };
    demoAttachments.set(id, attachment);
    return attachment;
  }

  const client = createServiceSupabaseClient();
  const requestedId = randomUUID();
  const storageExtension = validated.category === "image" ? "webp" : validated.extension;
  const requestedStoragePath =
    `${input.userId}/${input.uploadSessionId}/${requestedId}/file.${storageExtension}`;
  const now = new Date().toISOString();
  const reservationMetadata: Json = {
      sourceMime: input.file.type || null,
      extension: validated.extension,
      processingStartedAt: now,
  };
  const { data: reservation, error: reservationError } = await client
    .rpc("reserve_chat_attachment", {
      p_user_id: input.userId,
      p_conversation_id: input.conversationId ?? null,
      p_upload_session_id: input.uploadSessionId,
      p_client_upload_id: input.clientUploadId,
      p_attachment_id: requestedId,
      p_original_name: validated.originalName,
      p_storage_path: requestedStoragePath,
      p_mime_type: validated.mimeType,
      p_size_bytes: rawBuffer.length,
      p_category: validated.category,
      p_extraction_status:
        validated.category === "image" ? "not_applicable" : "processing",
      p_expires_at: expiresAt(input.plan),
      p_metadata: reservationMetadata,
      p_max_files: policy.maxFilesPerMessage,
      p_max_total_bytes: policy.maxBytesPerMessage,
    })
    .single();
  if (reservationError || !reservation) {
    if (reservationError?.message.includes("ATTACHMENT_FILE_LIMIT")) {
      throw new AttachmentError("LIMIT_EXCEEDED");
    }
    if (reservationError?.message.includes("ATTACHMENT_TOTAL_SIZE_LIMIT")) {
      throw new AttachmentError("TOTAL_SIZE_EXCEEDED");
    }
    if (reservationError?.message.includes("ATTACHMENT_ACCESS_DENIED")) {
      throw new AttachmentError("ACCESS_DENIED", 403);
    }
    throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
  }
  const id = reservation.attachment_id;
  const storagePath = reservation.reserved_storage_path;
  if (!reservation.was_created) {
    if (reservation.attachment_status !== "ready") {
      throw new AttachmentError("NOT_READY", 409);
    }
    const { data: existing, error: existingError } = await client
      .from("chat_attachments")
      .select("*")
      .eq("id", id)
      .eq("user_id", input.userId)
      .single();
    if (existingError || !existing) {
      throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
    }
    return mapAttachment(existing);
  }

  try {
    const result = await processAttachment(rawBuffer, validated.extension);
    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(storagePath, result.storageBuffer, {
        contentType: result.storageMimeType,
        upsert: false,
        cacheControl: "3600",
      });
    if (uploadError) throw new AttachmentError("STORAGE_UNAVAILABLE", 503);

    if (result.extractionStatus !== "not_applicable") {
      const { error: extractionError } = await client
        .from("chat_attachment_extractions")
        .insert({
          attachment_id: id,
          user_id: input.userId,
          content: result.extractedContent,
          truncated: result.truncated,
          metadata: result.metadata,
        });
      if (extractionError) throw new AttachmentError("EXTRACTION_FAILED", 422);
    }

    const storedMimeType =
      validated.category === "image" ? result.storageMimeType : validated.mimeType;
    const { data, error } = await client
      .from("chat_attachments")
      .update({
        status: "ready",
        extraction_status: result.extractionStatus,
        mime_type: storedMimeType,
        metadata: {
          extension: validated.extension,
          ...(result.metadata && typeof result.metadata === "object" && !Array.isArray(result.metadata)
            ? result.metadata
            : {}),
          truncated: result.truncated,
          processingCompletedAt: new Date().toISOString(),
        },
      })
      .eq("id", id)
      .eq("user_id", input.userId)
      .select("*")
      .single();
    if (error || !data) throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
    return mapAttachment(data);
  } catch (error) {
    await client.storage.from(bucket).remove([storagePath]).catch(() => undefined);
    await client
      .from("chat_attachments")
      .update({
        status: "failed",
        extraction_status: "failed",
        metadata: {
          extension: validated.extension,
          errorCode: error instanceof AttachmentError ? error.code : "EXTRACTION_FAILED",
        },
      })
      .eq("id", id)
      .eq("user_id", input.userId);
    throw error;
  }
}

export async function removeTemporaryAttachment(userId: string, attachmentId: string) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const attachment = demoAttachments.get(attachmentId);
    if (!attachment || attachment.userId !== userId || attachment.messageId) {
      throw new AttachmentError("NOT_FOUND", 404);
    }
    demoAttachments.delete(attachmentId);
    return;
  }
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_attachments")
    .select("*")
    .eq("id", attachmentId)
    .eq("user_id", userId)
    .is("message_id", null)
    .neq("status", "deleted")
    .maybeSingle();
  if (error || !data) throw new AttachmentError("NOT_FOUND", 404);
  const { error: removeError } = await client.storage.from(bucket).remove([data.storage_path]);
  if (removeError && data.status === "ready") {
    throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
  }
  await client
    .from("chat_attachments")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", attachmentId)
    .eq("user_id", userId);
}

export async function getReadyAttachmentContexts(input: {
  userId: string;
  plan: PlanKey;
  attachmentIds: string[];
  uploadSessionId: string;
  conversationId?: string;
}) {
  const policy = getChatAttachmentPolicy(input.plan);
  if (!input.attachmentIds.length) return [] satisfies ChatAttachmentContext[];
  if (!policy.enabled || input.attachmentIds.length > policy.maxFilesPerMessage) {
    throw new AttachmentError("LIMIT_EXCEEDED", policy.enabled ? 400 : 403);
  }
  if (new Set(input.attachmentIds).size !== input.attachmentIds.length) {
    throw new AttachmentError("LIMIT_EXCEEDED");
  }

  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return input.attachmentIds.map((id) => {
      const attachment = demoAttachments.get(id);
      if (
        !attachment ||
        attachment.userId !== input.userId ||
        attachment.uploadSessionId !== input.uploadSessionId ||
        attachment.status !== "ready"
      ) throw new AttachmentError("NOT_READY", 409);
      return {
        ...toAttachmentPart(attachment),
        processingNote: "Adjunto simulado en modo demo; su contenido no fue analizado.",
      };
    });
  }

  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_attachments")
    .select("*")
    .eq("user_id", input.userId)
    .eq("upload_session_id", input.uploadSessionId)
    .in("id", input.attachmentIds)
    .neq("status", "deleted");
  if (error || (data?.length ?? 0) !== input.attachmentIds.length) {
    throw new AttachmentError("ACCESS_DENIED", 403);
  }
  const { data: extractions, error: extractionError } = await client
    .from("chat_attachment_extractions")
    .select("attachment_id,content,truncated,metadata")
    .eq("user_id", input.userId)
    .in("attachment_id", input.attachmentIds);
  if (extractionError) throw new AttachmentError("EXTRACTION_FAILED", 422);
  const extractionById = new Map(
    (extractions ?? []).map((extraction) => [extraction.attachment_id, extraction]),
  );

  const totalBytes = (data ?? []).reduce((sum, row) => sum + row.size_bytes, 0);
  if (totalBytes > policy.maxBytesPerMessage) throw new AttachmentError("TOTAL_SIZE_EXCEEDED");

  const contexts: ChatAttachmentContext[] = [];
  let characterBudget = chatAttachmentProcessingLimits.maxExtractedCharactersPerMessage;
  for (const row of data ?? []) {
    if (row.status !== "ready") throw new AttachmentError("NOT_READY", 409);
    if (row.conversation_id && row.conversation_id !== input.conversationId) {
      throw new AttachmentError("ACCESS_DENIED", 403);
    }
    const extraction = extractionById.get(row.id);
    const extracted = extraction?.content?.slice(0, characterBudget) ?? "";
    characterBudget -= extracted.length;
    const attachment = mapAttachment(row);
    const context: ChatAttachmentContext = {
      ...toAttachmentPart(attachment, Boolean(extraction?.truncated) || characterBudget <= 0),
      ...(extracted ? { extractedContent: extracted } : {}),
      ...(!extracted && row.category !== "image"
        ? { processingNote: "No se encontró texto legible en este archivo." }
        : {}),
      ...(extraction?.truncated || characterBudget <= 0
        ? { processingNote: "El contenido fue analizado parcialmente por límites técnicos." }
        : {}),
    };
    if (row.category === "image") {
      if (!policy.allowVision) throw new AttachmentError("ACCESS_DENIED", 403);
      const { data: file, error: downloadError } = await client.storage
        .from(bucket)
        .download(row.storage_path);
      if (downloadError || !file) throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
      const bytes = Buffer.from(await file.arrayBuffer());
      context.imageDataUrl = `data:${row.mime_type};base64,${bytes.toString("base64")}`;
    }
    contexts.push(context);
  }
  return input.attachmentIds.map(
    (id) => contexts.find((attachment) => attachment.attachmentId === id)!,
  );
}

export async function linkAttachmentsToMessage(input: {
  userId: string;
  conversationId: string;
  messageId: string;
  uploadSessionId: string;
  attachmentIds: string[];
}) {
  if (!input.attachmentIds.length) return;
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    for (const id of input.attachmentIds) {
      const attachment = demoAttachments.get(id);
      if (!attachment || attachment.userId !== input.userId) {
        throw new AttachmentError("ACCESS_DENIED", 403);
      }
      attachment.conversationId = input.conversationId;
      attachment.messageId = input.messageId;
    }
    return;
  }
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_attachments")
    .update({
      conversation_id: input.conversationId,
      message_id: input.messageId,
      expires_at: null,
    })
    .eq("user_id", input.userId)
    .eq("upload_session_id", input.uploadSessionId)
    .eq("status", "ready")
    .is("message_id", null)
    .in("id", input.attachmentIds)
    .select("id");
  if (error || (data?.length ?? 0) !== input.attachmentIds.length) {
    throw new AttachmentError("ACCESS_DENIED", 403);
  }
}

export async function createAttachmentSignedUrl(userId: string, attachmentId: string) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    throw new AttachmentError("STORAGE_UNAVAILABLE", 503, "La previsualización remota no está disponible en modo demo.");
  }
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_attachments")
    .select("storage_path,original_name,mime_type,status")
    .eq("id", attachmentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new AttachmentError("NOT_FOUND", 404);
  if (data.status !== "ready") throw new AttachmentError("NOT_READY", 409);
  const signedUrlOptions = data.mime_type.startsWith("image/")
    ? undefined
    : { download: data.original_name };
  const { data: signed, error: signedError } = await client.storage
    .from(bucket)
    .createSignedUrl(
      data.storage_path,
      chatAttachmentProcessingLimits.signedUrlSeconds,
      signedUrlOptions,
    );
  if (signedError || !signed) throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
  return {
    url: signed.signedUrl,
    filename: data.original_name,
    mimeType: data.mime_type,
    expiresIn: chatAttachmentProcessingLimits.signedUrlSeconds,
  };
}

export async function cleanupTemporaryAttachments() {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return 0;
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_attachments")
    .select("id,storage_path")
    .is("message_id", null)
    .lt("expires_at", new Date().toISOString())
    .not("status", "in", '("processing","deleted")')
    .limit(200);
  if (error || !data?.length) return 0;
  await client.storage.from(bucket).remove(data.map((item) => item.storage_path));
  await client
    .from("chat_attachments")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .in("id", data.map((item) => item.id));
  return data.length;
}

export async function deleteConversationAttachments(userId: string, conversationId: string) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return;
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from("chat_attachments")
    .select("id,storage_path")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .neq("status", "deleted");
  if (error) throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
  if (!data?.length) return;
  const { error: removeError } = await client.storage
    .from(bucket)
    .remove(data.map((item) => item.storage_path));
  if (removeError) throw new AttachmentError("STORAGE_UNAVAILABLE", 503);
}
