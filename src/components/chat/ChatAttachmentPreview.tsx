"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { LocalChatAttachment } from "@/components/chat/useChatAttachments";

export function ChatAttachmentPreview({
  item,
  onClose,
}: {
  item: LocalChatAttachment | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);
  if (!item?.previewUrl) return null;
  return (
    <div
      aria-labelledby="attachment-preview-title"
      aria-modal="true"
      className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/60 p-4"
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
      role="dialog"
    >
      <section className="relative max-h-[90dvh] w-full max-w-4xl overflow-hidden rounded-[16px] bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="truncate text-sm font-black" id="attachment-preview-title">{item.file.name}</h2>
          <button aria-label="Cerrar previsualización" className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] hover:bg-slate-100" onClick={onClose} ref={closeRef} type="button"><X size={20} /></button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`Previsualización de ${item.file.name}`} className="max-h-[calc(90dvh-80px)] w-full object-contain" src={item.previewUrl} />
      </section>
    </div>
  );
}
