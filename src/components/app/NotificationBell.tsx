"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils/cn";

type NotificationRow = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "id" | "type" | "title" | "body" | "href" | "read_at" | "created_at"
>;

type NotificationsResponse = {
  data?: {
    notifications: NotificationRow[];
    unreadCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
};

const typeLabels: Record<NotificationRow["type"], string> = {
  reading_reminder: "Recordatorio",
  progress: "Progreso",
  recommendation: "Recomendación",
  ai: "IA",
  account: "Cuenta",
  subscription: "Suscripción",
  system: "Ceoteca",
  achievement: "Logro",
};

function formatRelativeDate(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60_000), 0);

  if (diffMinutes < 1) {
    return "Ahora";
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `Hace ${diffDays} d`;
}

export function NotificationBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );

  const getAccessToken = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();

    return data.session?.access_token ?? null;
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("Inicia sesión para ver tus notificaciones.");
      }

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = (await response.json()) as NotificationsResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "No pudimos cargar notificaciones.");
      }

      setNotifications(payload.data?.notifications ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos cargar notificaciones.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  async function markAllAsRead() {
    setIsUpdating(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("Inicia sesión para actualizar tus notificaciones.");
      }

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ all: true }),
      });
      const payload = (await response.json()) as NotificationsResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "No pudimos actualizar notificaciones.");
      }

      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? now,
        })),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos actualizar notificaciones.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return;

    const supabase = createBrowserSupabaseClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribeToNotifications() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      channel = supabase
        .channel(`notifications-${userData.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            const nextNotification = payload.new as NotificationRow;
            setNotifications((current) => [
              nextNotification,
              ...current.filter((item) => item.id !== nextNotification.id),
            ].slice(0, 20));
          },
        )
        .subscribe();
    }

    void subscribeToNotifications();
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative">
      <button
        aria-label="Notificaciones"
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full transition",
          tone === "light"
            ? "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
            : "text-white hover:bg-white/[0.06]",
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Bell aria-hidden="true" size={21} />
        {unreadCount > 0 ? (
          <span className={cn(
            "absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-purple px-1 text-[10px] font-semibold text-white ring-2",
            tone === "light" ? "ring-[#fbfaf8]" : "ring-[#03040b]",
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-7rem))] overflow-hidden rounded-[18px] border border-white/10 bg-[#090b14]/95 shadow-ambient backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
            <div>
              <p className="text-sm font-semibold text-white">Notificaciones</p>
              <p className="mt-1 text-xs text-text-muted">
                Actividad importante de tu cuenta
              </p>
            </div>
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs text-text-secondary transition hover:text-white disabled:opacity-50"
              disabled={isUpdating || unreadCount === 0}
              onClick={() => void markAllAsRead()}
              type="button"
            >
              {isUpdating ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={14} />
              ) : (
                <CheckCheck aria-hidden="true" size={14} />
              )}
              Leídas
            </button>
          </div>

          <div className="max-h-[440px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="grid min-h-32 place-items-center text-sm text-text-secondary">
                Cargando notificaciones...
              </div>
            ) : null}

            {!isLoading && error ? (
              <div className="rounded-[14px] border border-danger/25 bg-danger/10 p-4 text-sm leading-6 text-danger">
                {error}
              </div>
            ) : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm leading-6 text-text-secondary">
                Aún no tienes notificaciones. Cuando haya actividad relevante,
                aparecerá aquí.
              </div>
            ) : null}

            {!isLoading && !error
              ? notifications.map((notification) => {
                  const content = (
                    <div
                      className={cn(
                        "rounded-[14px] border p-3 transition hover:bg-white/[0.045]",
                        notification.read_at
                          ? "border-transparent bg-transparent"
                          : "border-brand-purple/25 bg-brand-purple/10",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-brand-purple">
                          {typeLabels[notification.type]}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {formatRelativeDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-white">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {notification.body}
                      </p>
                    </div>
                  );

                  return notification.href ? (
                    <Link href={notification.href} key={notification.id}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
