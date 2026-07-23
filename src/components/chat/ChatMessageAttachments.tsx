"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, File, FileSpreadsheet, ImageIcon, Loader2, X } from "lucide-react";

import { formatAttachmentBytes } from "@/config/chat-attachments";
import type { ChatAttachmentPart } from "@/lib/chat/attachments/model";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";

function parseAttachmentParts(parts: Json | null): ChatAttachmentPart[] {
  if (!Array.isArray(parts)) return [];
  return parts.flatMap((part) => {
    if (
      !part ||
      typeof part !== "object" ||
      Array.isArray(part) ||
      part.type !== "attachment" ||
      typeof part.attachmentId !== "string" ||
      typeof part.filename !== "string" ||
      typeof part.mimeType !== "string" ||
      typeof part.sizeBytes !== "number" ||
      !["document", "data", "image"].includes(String(part.category))
    ) return [];
    return [part as unknown as ChatAttachmentPart];
  });
}

export function ChatMessageAttachments({ parts }: { parts: Json | null }) {
  const attachments = useMemo(() => parseAttachmentParts(parts), [parts]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!preview) return;
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [preview]);

  async function openAttachment(attachment: ChatAttachmentPart) {
    setOpenError(null);
    setOpeningId(attachment.attachmentId);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró.");
      const response = await fetch(`/api/chat/attachments/${attachment.attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json() as {
        data?: { url: string; filename: string };
        error?: { message: string };
      };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "No pudimos abrir el archivo.");
      if (attachment.category === "image") {
        setPreview(payload.data);
      } else {
        window.open(payload.data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setOpenError(
        error instanceof Error ? error.message : "No pudimos abrir el archivo.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  if (!attachments.length) return null;
  return (
    <>
      <div className="mb-2 flex max-w-full flex-wrap justify-end gap-2">
        {attachments.map((attachment) => {
          const Icon = attachment.category === "image"
            ? ImageIcon
            : attachment.category === "data" ? FileSpreadsheet : File;
          return (
            <button
              aria-label={`Abrir ${attachment.filename}`}
              className="flex min-h-12 max-w-[260px] items-center gap-2 rounded-[12px] border border-violet-200 bg-white px-3 py-2 text-left text-slate-800 hover:border-violet-400"
              key={attachment.attachmentId}
              onClick={() => void openAttachment(attachment)}
              type="button"
            >
              {openingId === attachment.attachmentId
                ? <Loader2 className="shrink-0 animate-spin motion-reduce:animate-none" size={18} />
                : <Icon className="shrink-0 text-violet-700" size={18} />}
              <span className="min-w-0">
                <span className="block truncate text-xs font-black">{attachment.filename}</span>
                <span className="block text-[10px] text-slate-500">
                  {formatAttachmentBytes(attachment.sizeBytes)}
                  {attachment.truncated ? " · análisis parcial" : ""}
                </span>
              </span>
              <ExternalLink className="shrink-0 text-slate-400" size={14} />
            </button>
          );
        })}
      </div>
      {openError ? (
        <p aria-live="assertive" className="mb-2 text-right text-xs font-bold text-rose-700" role="alert">
          {openError} Vuelve a intentarlo.
        </p>
      ) : null}
      {preview ? (
        <div
          aria-label={`Previsualización de ${preview.filename}`}
          aria-modal="true"
          className="fixed inset-0 z-[210] grid place-items-center bg-slate-950/60 p-4"
          onMouseDown={(event) => { if (event.currentTarget === event.target) setPreview(null); }}
          role="dialog"
        >
          <section className="w-full max-w-4xl rounded-[16px] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-black text-slate-900">{preview.filename}</p>
              <button aria-label="Cerrar previsualización" className="grid h-11 w-11 place-items-center rounded-[10px] text-slate-700 hover:bg-slate-100" onClick={() => setPreview(null)} ref={closeRef} type="button"><X size={20} /></button>
            </div>
            {/* A short-lived signed URL cannot be handled reliably by next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={preview.filename} className="max-h-[calc(90dvh-80px)] w-full object-contain" src={preview.url} />
          </section>
        </div>
      ) : null}
    </>
  );
}
