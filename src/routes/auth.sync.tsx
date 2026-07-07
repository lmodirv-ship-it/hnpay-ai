import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pickPostLoginRoute } from "@/lib/auth/use-session";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/auth/sync")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
    targetApp: typeof s.targetApp === "string" ? s.targetApp : "",
    next: typeof s.next === "string" ? s.next : "",
  }),
  head: () => ({ meta: [{ title: "Sync · HN-Pay Hub" }] }),
  component: SyncBridge,
});

function SyncBridge() {
  const { token, targetApp, next } = useSearch({ from: "/auth/sync" });
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "err">("working");
  const [msg, setMsg] = useState("Verifying identity bridge…");

  useEffect(() => {
    (async () => {
      try {
        // If a JWT token was passed from another HN app, hydrate the session with it.
        // We accept a refresh token in `token`. Missing → fall back to existing session.
        if (token) {
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
  }, [token, targetApp, next]);

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
