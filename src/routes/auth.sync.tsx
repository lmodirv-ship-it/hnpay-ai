import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pickPostLoginRoute } from "@/lib/auth/use-session";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/auth/sync")({
  validateSearch: (s: Record<string, unknown>) => ({
    targetApp: typeof s.targetApp === "string" ? s.targetApp : "",
    next: typeof s.next === "string" ? s.next : "",
  }),
  head: () => ({ meta: [{ title: "Sync · HN-Pay Hub" }] }),
  component: SyncBridge,
});

/**
 * Read the refresh token from the URL fragment (`#token=...`) rather than
 * the query string. Fragments are never sent to servers, don't appear in
 * server logs / referrer headers, and are stripped from the URL after use.
 */
function readTokenFromHash(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!raw) return "";
  const params = new URLSearchParams(raw);
  return params.get("token") ?? "";
}

function SyncBridge() {
  const { targetApp, next } = useSearch({ from: "/auth/sync" });
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "err">("working");
  const [msg, setMsg] = useState("Verifying identity bridge…");

  useEffect(() => {
    (async () => {
      try {
        const token = readTokenFromHash();
        if (token) {
          // Strip the token from the URL immediately so it can't leak via
          // browser history, screenshots, or copy/paste of the address bar.
          try {
            const url = new URL(window.location.href);
            window.history.replaceState({}, "", `${url.pathname}${url.search}`);
          } catch {
            // ignore
          }
          const { error } = await supabase.auth.refreshSession({ refresh_token: token });
          if (error) throw error;
        }
        setMsg("Resolving your access rights…");
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          navigate({ to: "/auth", search: { next: next || "/", app: targetApp } });
          return;
        }
        const { data: r } = await supabase
          .from("user_roles").select("app_id, role").eq("user_id", userData.user.id);
        setStatus("ok");
        setMsg(`Welcome to ${targetApp || "the HN network"}.`);
        setTimeout(() => {
          if (next && next.startsWith("/")) navigate({ to: next });
          else navigate({ to: pickPostLoginRoute((r ?? []) as any) });
        }, 700);
      } catch (e: any) {
        setStatus("err");
        setMsg(e.message ?? "Bridge failed. Please sign in again.");
      }
    })();
  }, [targetApp, next]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060d] px-4 font-[Inter,ui-sans-serif,system-ui] text-white">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
        {status === "working" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-300" />}
        {status === "ok" && <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400" />}
        {status === "err" && <XCircle className="mx-auto h-8 w-8 text-rose-400" />}
        <div className="mt-4 text-lg font-bold">Universal Bridge</div>
        <div className="mt-2 text-sm text-neutral-400">{msg}</div>
        {targetApp && <div className="mt-3 text-[11px] uppercase tracking-wider text-amber-300">→ {targetApp}</div>}
      </div>
    </div>
  );
}
