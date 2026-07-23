"use client";

import { CloudOff, Loader2, RefreshCw, Wifi } from "lucide-react";

import type { ChatConnectivityState } from "@/components/chat/useChatConnectivity";

export function ChatConnectionStatus({ state, onRetry }: { state: ChatConnectivityState; onRetry: () => void }) {
  if (state === "online") return null;
  const offline = state === "offline";
  return (
    <div
      aria-live="polite"
      className="flex min-h-10 items-center justify-center gap-2 border-b border-slate-950/[0.08] bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900"
      role="status"
    >
      {offline ? <CloudOff size={15} /> : state === "checking" ? <Loader2 className="animate-spin motion-reduce:animate-none" size={15} /> : <Wifi size={15} />}
      <span>{offline ? "Sin conexión. Tu borrador está guardado." : state === "checking" ? "Comprobando conexión…" : "Conexión restablecida"}</span>
      {offline ? (
        <button className="ml-1 inline-flex min-h-8 items-center gap-1 rounded-[8px] px-2 hover:bg-amber-100" onClick={onRetry} type="button">
          <RefreshCw size={13} /> Reintentar
        </button>
      ) : null}
    </div>
  );
}
