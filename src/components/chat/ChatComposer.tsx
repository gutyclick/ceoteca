"use client";

import { useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Loader2, Send, Square } from "lucide-react";

import { chatComposerMaxLength } from "@/config/chat";
import { cn } from "@/lib/utils/cn";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onEscape?: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  disabledReason?: string;
  locked?: boolean;
  lockedReason?: string;
  isSubmitting?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  maxLength?: number;
  maxHeight?: number;
  tone?: "light" | "dark";
  className?: string;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  onEscape,
  textareaRef,
  disabled = false,
  disabledReason,
  locked = false,
  lockedReason,
  isSubmitting = false,
  isStreaming = false,
  placeholder = "Cuéntale a CEO qué quieres resolver…",
  maxLength = chatComposerMaxLength,
  maxHeight = 160,
  tone = "light",
  className,
}: ChatComposerProps) {
  const descriptionId = useId();
  const errorId = useId();
  const composingRef = useRef(false);
  const submitLockRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const trimmed = value.trim();
  const overLimit = value.length > maxLength;
  const nearLimit = value.length >= maxLength * 0.8;
  const cannotWrite = disabled || locked || isSubmitting;
  const canSubmit = Boolean(trimmed) && !overLimit && !cannotWrite && !isStreaming;
  const statusMessage = locked
    ? lockedReason
    : disabled
      ? disabledReason
      : isStreaming && trimmed
        ? "Espera a que CEO termine o detén la respuesta. Tu borrador está guardado."
        : undefined;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight, textareaRef, value]);

  function submit() {
    if (!canSubmit || submitLockRef.current) return;
    submitLockRef.current = true;
    onSubmit();
    queueMicrotask(() => {
      submitLockRef.current = false;
    });
  }

  return (
    <div className={cn("relative", className)} data-focused={isFocused || undefined}>
      <form
        aria-label="Escribir a CEO"
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_46px] items-end gap-2 rounded-[16px] border p-2 transition-colors motion-reduce:transition-none",
          tone === "dark" ? "border-white/10 bg-white/[0.055]" : "bg-white",
          overLimit
            ? "border-rose-400 ring-4 ring-rose-50"
            : "border-slate-950/[0.10] focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50",
          (disabled || locked) && (tone === "dark" ? "bg-white/[0.035]" : "bg-slate-50"),
        )}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          aria-describedby={cn(statusMessage && descriptionId, overLimit && errorId) || undefined}
          aria-invalid={overLimit || undefined}
          aria-label="Mensaje para CEO"
          className={cn(
            "min-h-11 resize-none bg-transparent px-2 py-2.5 text-base leading-6 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500",
            tone === "dark" ? "text-white" : "text-slate-950",
          )}
          disabled={cannotWrite}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => onChange(event.target.value)}
          onCompositionEnd={() => { composingRef.current = false; }}
          onCompositionStart={() => { composingRef.current = true; }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onEscape?.();
              return;
            }
            const hasCoarsePointer = typeof window !== "undefined"
              && typeof window.matchMedia === "function"
              && window.matchMedia("(pointer: coarse)").matches;
            if (
              event.key === "Enter"
              && !event.shiftKey
              && !hasCoarsePointer
              && !composingRef.current
              && !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          ref={textareaRef}
          rows={1}
          value={value}
        />
        <button
          aria-label={isStreaming ? "Detener respuesta" : isSubmitting ? "Enviando mensaje" : "Enviar mensaje"}
          className="grid h-11 w-11 place-items-center rounded-[13px] bg-violet-700 text-white transition-colors hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 motion-reduce:transition-none"
          disabled={isStreaming ? !onStop : !canSubmit}
          onClick={isStreaming ? onStop : undefined}
          type={isStreaming ? "button" : "submit"}
        >
          {isStreaming ? <Square fill="currentColor" size={15} /> : isSubmitting ? <Loader2 className="animate-spin motion-reduce:animate-none" size={18} /> : <Send size={18} />}
        </button>
      </form>

      <div className="mt-1.5 flex min-h-5 items-start justify-between gap-3 px-1 text-[11px] font-semibold">
        <div>
          {overLimit ? (
            <p aria-live="assertive" className="text-rose-700" id={errorId} role="alert">
              Tu mensaje es demasiado largo. Reduce el contenido para continuar.
            </p>
          ) : statusMessage ? (
            <p className={locked ? "text-amber-600" : tone === "dark" ? "text-slate-400" : "text-slate-500"} id={descriptionId}>
              {statusMessage}
            </p>
          ) : null}
        </div>
        {nearLimit ? (
          <p className={overLimit ? "shrink-0 text-rose-700" : "shrink-0 text-slate-500"}>
            {value.length.toLocaleString("es")} / {maxLength.toLocaleString("es")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
