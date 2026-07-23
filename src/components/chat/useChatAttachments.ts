"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";

import {
  chatAttachmentFormats,
  getChatAttachmentExtension,
  getChatAttachmentPolicy,
  type ChatAttachmentCategory,
} from "@/config/chat-attachments";
import type { PlanKey } from "@/config/plans";
import type { ChatAttachment } from "@/lib/chat/attachments/model";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type LocalChatAttachmentState =
  | "selected"
  | "validating"
  | "uploading"
  | "ready"
  | "failed"
  | "cancelled";

export type LocalChatAttachment = {
  localId: string;
  file: File;
  previewUrl: string | null;
  state: LocalChatAttachmentState;
  error: string | null;
  remote: ChatAttachment | null;
};

type ApiResponse = {
  data?: { attachment: ChatAttachment };
  error?: { message: string };
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

export function useChatAttachments(input: {
  plan: PlanKey;
  conversationId: string | null;
}) {
  const policy = useMemo(() => getChatAttachmentPolicy(input.plan), [input.plan]);
  const [items, setItems] = useState<LocalChatAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const controllersRef = useRef(new Map<string, AbortController>());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const upload = useCallback(async (item: LocalChatAttachment) => {
    const controller = new AbortController();
    controllersRef.current.set(item.localId, controller);
    setItems((current) => current.map((candidate) =>
      candidate.localId === item.localId
        ? { ...candidate, state: "uploading", error: null }
        : candidate
    ));
    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      const form = new FormData();
      form.set("file", item.file);
      form.set("uploadSessionId", uploadSessionIdRef.current);
      form.set("clientUploadId", item.localId);
      if (input.conversationId && uuidPattern.test(input.conversationId)) {
        form.set("conversationId", input.conversationId);
      }
      const response = await fetch("/api/chat/attachments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: controller.signal,
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "La subida se interrumpió.");
      }
      setItems((current) => current.map((candidate) =>
        candidate.localId === item.localId
          ? { ...candidate, state: "ready", remote: payload.data!.attachment, error: null }
          : candidate
      ));
      track("attachment_upload_completed", {
        category: payload.data.attachment.category,
        approximate_kb: Math.ceil(payload.data.attachment.sizeBytes / 1024),
        plan: input.plan,
      });
    } catch (caughtError) {
      if (controller.signal.aborted) {
        setItems((current) => current.map((candidate) =>
          candidate.localId === item.localId
            ? { ...candidate, state: "cancelled", error: "Subida cancelada." }
            : candidate
        ));
      } else {
        const message = caughtError instanceof Error ? caughtError.message : "La subida se interrumpió.";
        setItems((current) => current.map((candidate) =>
          candidate.localId === item.localId
            ? { ...candidate, state: "failed", error: message }
            : candidate
        ));
      }
    } finally {
      controllersRef.current.delete(item.localId);
    }
  }, [input.conversationId, input.plan]);

  const addFiles = useCallback((files: File[]) => {
    if (!policy.enabled) {
      setError("Los archivos están disponibles desde el plan Pro.");
      return;
    }
    const current = itemsRef.current.filter((item) => item.state !== "cancelled");
    const fingerprints = new Set(current.map((item) => fileFingerprint(item.file)));
    const accepted: LocalChatAttachment[] = [];
    let totalBytes = current.reduce((sum, item) => sum + item.file.size, 0);
    let nextError: string | null = null;

    for (const file of files) {
      if (current.length + accepted.length >= policy.maxFilesPerMessage) {
        nextError = "Has alcanzado el máximo de archivos por mensaje.";
        break;
      }
      if (fingerprints.has(fileFingerprint(file))) continue;
      const extension = getChatAttachmentExtension(file.name);
      if (!extension || !policy.allowedExtensions.includes(extension)) {
        nextError = "Este tipo de archivo no es compatible.";
        continue;
      }
      const allowedMimeTypes: readonly string[] = chatAttachmentFormats[extension].mimeTypes;
      if (
        file.type &&
        file.type !== "application/octet-stream" &&
        !allowedMimeTypes.includes(file.type)
      ) {
        nextError = "Este tipo de archivo no es compatible.";
        continue;
      }
      if (file.size > policy.maxBytesPerFile) {
        nextError = "El archivo supera el tamaño permitido.";
        continue;
      }
      if (totalBytes + file.size > policy.maxBytesPerMessage) {
        nextError = "Los archivos seleccionados superan el límite permitido.";
        break;
      }
      const definitionCategory: ChatAttachmentCategory =
        ["png", "jpg", "jpeg", "webp"].includes(extension)
          ? "image"
          : extension === "csv" ? "data" : "document";
      const next: LocalChatAttachment = {
        localId: crypto.randomUUID(),
        file,
        previewUrl: definitionCategory === "image" ? URL.createObjectURL(file) : null,
        state: "validating",
        error: null,
        remote: null,
      };
      accepted.push(next);
      fingerprints.add(fileFingerprint(file));
      totalBytes += file.size;
      track("attachment_selected", {
        category: definitionCategory,
        approximate_kb: Math.ceil(file.size / 1024),
        plan: input.plan,
      });
    }

    if (nextError) setError(nextError);
    if (!accepted.length) return;
    setItems((value) => [...value, ...accepted]);
    for (const item of accepted) void upload(item);
  }, [input.plan, policy, upload]);

  const remove = useCallback(async (localId: string) => {
    const item = itemsRef.current.find((candidate) => candidate.localId === localId);
    if (!item) return;
    controllersRef.current.get(localId)?.abort();
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setItems((current) => current.filter((candidate) => candidate.localId !== localId));
    if (item.remote) {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          await fetch(`/api/chat/attachments/${item.remote.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        // The server cleanup task removes abandoned temporary files.
      }
    }
  }, []);

  const retry = useCallback((localId: string) => {
    const item = itemsRef.current.find((candidate) => candidate.localId === localId);
    if (!item || !["failed", "cancelled"].includes(item.state)) return;
    void upload(item);
  }, [upload]);

  const clearAfterSend = useCallback(() => {
    for (const item of itemsRef.current) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setItems([]);
    setError(null);
    uploadSessionIdRef.current = crypto.randomUUID();
  }, []);

  useEffect(() => () => {
    for (const controller of controllersRef.current.values()) controller.abort();
    for (const item of itemsRef.current) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  const ready = items.filter((item) => item.state === "ready" && item.remote);
  return {
    addFiles,
    clearAfterSend,
    error,
    hasBlockingUploads: items.some((item) => item.state !== "ready"),
    items,
    policy,
    readyAttachmentIds: ready.map((item) => item.remote!.id),
    remove,
    retry,
    setError,
    uploadSessionId: uploadSessionIdRef.current,
  };
}
