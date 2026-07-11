"use client";

import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";

import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
const seenStorageKey = "ceoteca-seen-achievement-notifications";

function readSeenIds() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(seenStorageKey) ?? "[]"));
  } catch {
    return new Set<string>();
  }
}

function rememberNotification(id: string) {
  const seen = readSeenIds();
  seen.add(id);
  localStorage.setItem(seenStorageKey, JSON.stringify([...seen].slice(-100)));
}

export function AchievementToastHost() {
  const [notification, setNotification] = useState<NotificationRow | null>(null);

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const supabase = createBrowserSupabaseClient();

    function showAchievement(item: NotificationRow) {
      if (item.type !== "achievement" || readSeenIds().has(item.id)) return;
      rememberNotification(item.id);
      setNotification(item);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setNotification(null), 6500);
    }

    async function loadLatest() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("type", "achievement")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) showAchievement(data);
    }

    const channel = supabase
      .channel("achievement-unlocks")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => showAchievement(payload.new as NotificationRow),
      )
      .subscribe();

    void loadLatest();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      void supabase.removeChannel(channel);
    };
  }, []);

  if (!notification) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed right-4 top-4 z-[100] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-violet-300 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
    >
      <div className="flex items-center gap-4 p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-violet-600 to-fuchsia-500">
          <Trophy aria-hidden="true" size={27} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">
            Logro desbloqueado
          </p>
          <p className="mt-1 font-black">
            {notification.title.replace("Logro desbloqueado: ", "")}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-300">{notification.body}</p>
        </div>
        <button
          aria-label="Cerrar notificación"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
          onClick={() => setNotification(null)}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
    </aside>
  );
}
