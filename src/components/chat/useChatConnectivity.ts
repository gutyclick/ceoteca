"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { chatTimeouts, withTimeout } from "@/lib/chat/retry";

export type ChatConnectivityState = "online" | "offline" | "checking" | "restored";

export function useChatConnectivity() {
  const [state, setState] = useState<ChatConnectivityState>(() =>
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online",
  );
  const mountedRef = useRef(true);

  const probe = useCallback(async () => {
    if (!navigator.onLine) {
      setState("offline");
      return false;
    }
    setState((current) => current === "offline" ? "checking" : current);
    try {
      const response = await withTimeout(
        (signal) => fetch("/api/health", { method: "HEAD", cache: "no-store", signal }),
        chatTimeouts.connectivityProbeMs,
      );
      if (!response.ok) throw new Error("Health check failed");
      if (!mountedRef.current) return true;
      setState((current) => current === "checking" || current === "offline" ? "restored" : "online");
      return true;
    } catch {
      if (mountedRef.current) setState("offline");
      return false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const handleOffline = () => setState("offline");
    const handleOnline = () => void probe();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void probe();
    }, 30_000);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.clearInterval(interval);
    };
  }, [probe]);

  useEffect(() => {
    if (state !== "restored") return;
    const timer = window.setTimeout(() => setState("online"), 3_000);
    return () => window.clearTimeout(timer);
  }, [state]);

  return { state, probe, canReachServer: state === "online" || state === "restored" };
}
