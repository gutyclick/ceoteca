"use client";

import { File, FileSpreadsheet, ImageIcon, Loader2, RefreshCw, X } from "lucide-react";

import { formatAttachmentBytes } from "@/config/chat-attachments";
import type { LocalChatAttachment } from "@/components/chat/useChatAttachments";

type Props = {
  items: LocalChatAttachment[];
  onRemove: (localId: string) => void;
  onRetry: (localId: string) => void;
  onPreview: (item: LocalChatAttachment) => void;
};

const statusLabels = {
  selected: "Seleccionado",
  validating: "Validando…",
  uploading: "Subiendo…",
  ready: "Listo",
  failed: "Error",
  cancelled: "Cancelado",
} as const;

export function ChatAttachmentTray({ items, onRemove, onRetry, onPreview }: Props) {
  if (!items.length) return null;
  return (
    <div aria-label="Archivos adjuntos" className="flex gap-2 overflow-x-auto px-1 pb-2">
      {items.map((item) => {
        const category = item.remote?.category ??
          (item.file.type.startsWith("image/") ? "image" : item.file.name.toLowerCase().endsWith(".csv") ? "data" : "document");
        const Icon = category === "image" ? ImageIcon : category === "data" ? FileSpreadsheet : File;
        const isBusy = item.state === "validating" || item.state === "uploading";
        return (
          <article
            className="relative flex min-w-[210px] max-w-[260px] items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50 p-2.5"
            key={item.localId}
          >
            <button
              aria-label={`Previsualizar ${item.file.name}`}
              className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-white text-violet-700"
              disabled={!item.previewUrl}
              onClick={() => onPreview(item)}
              type="button"
            >
              {item.previewUrl ? (
                // A local object URL cannot be optimized by next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={item.previewUrl} />
              ) : <Icon size={21} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-800" title={item.file.name}>{item.file.name}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {formatAttachmentBytes(item.file.size)} · {category === "data" ? "Datos" : category === "image" ? "Imagen" : "Documento"}
              </p>
              <p
                aria-live="polite"
                className={item.state === "failed" ? "mt-1 text-[11px] font-bold text-rose-700" : "mt-1 text-[11px] font-bold text-slate-500"}
              >
                {isBusy ? <Loader2 className="mr-1 inline animate-spin motion-reduce:animate-none" size={11} /> : null}
                {item.error ?? statusLabels[item.state]}
              </p>
            </div>
            <div className="flex shrink-0">
              {item.state === "failed" || item.state === "cancelled" ? (
                <button aria-label={`Reintentar ${item.file.name}`} className="grid h-9 w-9 place-items-center text-violet-700" onClick={() => onRetry(item.localId)} type="button"><RefreshCw size={16} /></button>
              ) : null}
              <button aria-label={`Eliminar ${item.file.name}`} className="grid h-9 w-9 place-items-center text-slate-500 hover:text-rose-700" onClick={() => onRemove(item.localId)} type="button"><X size={17} /></button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
