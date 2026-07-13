"use client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
export async function editorialRequest<T>(url: string, init?: RequestInit) {
  const { data } = await createBrowserSupabaseClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("UNAUTHORIZED");
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: { message: string };
  };
  if (!response.ok || payload.data === undefined)
    throw new Error(payload.error?.message ?? "EDITORIAL_ERROR");
  return payload.data;
}
