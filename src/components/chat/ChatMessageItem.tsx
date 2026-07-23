"use client";

import { memo, useState } from "react";
import { Check, Copy, Pencil, RefreshCw, Send, Sparkles, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";

import { MessageActionsMenu, type MessageMenuAction } from "@/components/chat/MessageActionsMenu";
import { SafeMarkdown } from "@/components/chat/SafeMarkdown";
import type { StoredChatMessage } from "@/lib/chat/model";
import { cn } from "@/lib/utils/cn";

export type ResponseAction = "shorter" | "example" | "steps" | "checklist" | "business";
export type MessageRating = "helpful" | "not_helpful" | null;

type ChatMessageItemProps = {
  message: StoredChatMessage;
  rating?: MessageRating;
  isGenerating?: boolean;
  onEditUser: (message: StoredChatMessage) => void;
  onResendUser: (message: StoredChatMessage) => void;
  onDeleteUser: (message: StoredChatMessage) => void;
  onRegenerate: (message: StoredChatMessage) => void;
  onContinue: (message: StoredChatMessage) => void;
  onResponseAction: (message: StoredChatMessage, action: ResponseAction) => void;
  onRate: (message: StoredChatMessage, rating: Exclude<MessageRating, null>) => void;
  onEditPrevious: (message: StoredChatMessage) => void;
};

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("es", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function ChatMessageItemComponent({ message, rating = null, isGenerating = false, onDeleteUser, onEditUser, onResendUser, onRegenerate, onContinue, onResponseAction, onRate, onEditPrevious }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isStreaming = message.status === "streaming";
  const isPending = message.status === "pending";
  const isStopped = message.status === "stopped";
  const isInterrupted = message.status === "interrupted";
  const isFailed = message.status === "failed";

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  const copyAction: MessageMenuAction = { id: "copy", label: copied ? "Copiado" : "Copiar", icon: copied ? <Check size={16} /> : <Copy size={16} />, onSelect: () => void copyMessage() };
  const menuActions: MessageMenuAction[] = isUser
    ? [copyAction, { id: "edit", label: "Editar", icon: <Pencil size={16} />, onSelect: () => onEditUser(message) }, { id: "resend", label: "Reenviar desde aquí", icon: <Send size={16} />, onSelect: () => onResendUser(message) }]
    : [
        copyAction,
        { id: "regenerate", label: "Regenerar", icon: <RefreshCw size={16} />, onSelect: () => onRegenerate(message) },
        { id: "shorter", label: "Hacer más breve", onSelect: () => onResponseAction(message, "shorter") },
        { id: "example", label: "Explicar con un ejemplo", onSelect: () => onResponseAction(message, "example") },
        { id: "steps", label: "Convertir en pasos", onSelect: () => onResponseAction(message, "steps") },
        { id: "checklist", label: "Crear checklist", onSelect: () => onResponseAction(message, "checklist") },
        { id: "business", label: "Adaptar a mi negocio", onSelect: () => onResponseAction(message, "business") },
      ];

  if (isUser) {
    return (
      <article aria-label="Mensaje del usuario" className="group ml-auto flex w-full max-w-[86%] flex-col items-end sm:max-w-[72%]" tabIndex={0}>
        <div className={cn("rounded-[16px] rounded-br-[5px] px-4 py-3 text-sm leading-6 sm:text-[15px]", isFailed ? "border border-rose-200 bg-rose-50 text-rose-900" : "bg-violet-600 text-white")}>{message.content}</div>
        {isFailed ? (
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button className="min-h-10 rounded-[10px] bg-rose-700 px-3 text-xs font-black text-white" onClick={() => onResendUser(message)} type="button">Reintentar</button>
            <button className="min-h-10 rounded-[10px] border border-rose-200 bg-white px-3 text-xs font-black text-rose-800" onClick={() => onEditUser(message)} type="button">Editar</button>
            <button aria-label="Eliminar mensaje fallido" className="grid h-10 w-10 place-items-center rounded-[10px] border border-rose-200 bg-white text-rose-800" onClick={() => onDeleteUser(message)} type="button"><Trash2 size={16} /></button>
          </div>
        ) : null}
        <div className="mt-1 flex min-h-11 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <span className="mr-1 text-[11px] text-slate-400">{formatMessageTime(message.createdAt)}</span>
          <button aria-label="Copiar mensaje" className="hidden h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100 sm:grid" onClick={() => void copyMessage()} type="button">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
          <button aria-label="Editar mensaje" className="hidden h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100 sm:grid" onClick={() => onEditUser(message)} type="button"><Pencil size={16} /></button>
          <MessageActionsMenu actions={menuActions} label="Más acciones del mensaje" />
        </div>
        <span aria-live="polite" className="sr-only">{copied ? "Copiado" : ""}</span>
      </article>
    );
  }

  return (
    <article aria-label="Respuesta de CEO" className="group grid w-full grid-cols-[36px_minmax(0,1fr)] gap-3" tabIndex={0}>
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-violet-50 text-violet-700"><Sparkles size={18} /></span>
      <div className="min-w-0">
        <div className={cn("min-w-0", isFailed && "rounded-[14px] border border-rose-200 bg-rose-50 p-4", isInterrupted && "rounded-[14px] border border-amber-200 bg-amber-50 p-4")}>
          {isPending ? <div className="flex items-center gap-2 text-sm text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-500 motion-reduce:animate-none" />{message.content || "Analizando tu solicitud…"}</div> : null}
          {!isPending && message.content ? <SafeMarkdown content={message.content} /> : null}
          {isStreaming ? <span aria-hidden="true" className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-violet-600 motion-reduce:animate-none" /> : null}
          {isStopped ? <p className="mt-3 text-xs font-bold text-amber-700">Respuesta detenida</p> : null}
          {isInterrupted ? <><p className="mt-3 text-sm font-bold text-amber-900">La respuesta se interrumpió.</p><button className="mt-3 min-h-11 rounded-[10px] bg-amber-700 px-3 text-xs font-black text-white" disabled={isGenerating} onClick={() => onRegenerate(message)} type="button">Volver a generar</button></> : null}
          {isFailed ? <><p className="text-sm font-bold text-rose-800">CEO no pudo completar esta respuesta.</p><div className="mt-3 flex flex-wrap gap-2"><button className="min-h-11 rounded-[10px] bg-rose-700 px-3 text-xs font-black text-white" onClick={() => onRegenerate(message)} type="button">Reintentar</button><button className="min-h-11 rounded-[10px] border border-rose-200 bg-white px-3 text-xs font-black text-rose-800" onClick={() => onEditPrevious(message)} type="button">Editar mensaje anterior</button></div></> : null}
        </div>

        {!isPending && !isStreaming && !isFailed && !isInterrupted ? (
          <div className="mt-2 flex min-h-11 flex-wrap items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <span className="mr-1 text-[11px] text-slate-400">{formatMessageTime(message.createdAt)}</span>
            <button aria-label="Copiar respuesta" className="hidden h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100 sm:grid" onClick={() => void copyMessage()} type="button">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            <button aria-label="Regenerar respuesta" className="hidden h-11 w-11 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100 disabled:opacity-40 sm:grid" disabled={isGenerating} onClick={() => onRegenerate(message)} type="button"><RefreshCw size={16} /></button>
            <button aria-label="Marcar como útil" className={cn("grid h-11 w-11 place-items-center rounded-[10px] hover:bg-emerald-50", rating === "helpful" ? "bg-emerald-50 text-emerald-700" : "text-slate-500")} onClick={() => onRate(message, "helpful")} type="button"><ThumbsUp fill={rating === "helpful" ? "currentColor" : "none"} size={16} /></button>
            <button aria-label="Marcar como poco útil" className={cn("grid h-11 w-11 place-items-center rounded-[10px] hover:bg-amber-50", rating === "not_helpful" ? "bg-amber-50 text-amber-700" : "text-slate-500")} onClick={() => onRate(message, "not_helpful")} type="button"><ThumbsDown fill={rating === "not_helpful" ? "currentColor" : "none"} size={16} /></button>
            <MessageActionsMenu actions={menuActions} label="Más acciones de la respuesta" />
            {isStopped ? <button className="min-h-11 rounded-[10px] px-3 text-xs font-black text-violet-700 hover:bg-violet-50" onClick={() => onContinue(message)} type="button">Continuar</button> : null}
          </div>
        ) : null}
        <span aria-live="polite" className="sr-only">{copied ? "Copiado" : ""}</span>
      </div>
    </article>
  );
}

export const ChatMessageItem = memo(ChatMessageItemComponent);
