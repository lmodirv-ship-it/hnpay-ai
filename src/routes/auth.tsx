import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { pickPostLoginRoute } from "@/lib/auth/use-session";
import { Crown, Loader2, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from "lucide-react";

const searchSchema = z.object({
  next: fallback(z.string(), "").default(""),
  app: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Sign in · HN-Pay Hub" },
      { name: "description", content: "Central identity gateway for the HN network." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next, app } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      await routeAfterLogin();
    });
  }, []);

  const routeAfterLogin = async () => {
    if (next && next.startsWith("/")) {
      navigate({ to: next });
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: r } = await supabase
      .from("user_roles")
      .select("app_id, role")
      .eq("user_id", userData.user.id);
    navigate({ to: pickPostLoginRoute((r ?? []) as any) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: name, origin_app: app || "HN-HUB" },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await routeAfterLogin();
    } catch (e: any) {
      setErr(e.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) setErr(result.error.message ?? "Google sign-in failed");
    if (result.redirected) return;
    await routeAfterLogin();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060d] px-4 font-[Inter,ui-sans-serif,system-ui] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/15 shadow-[0_0_30px_rgba(251,191,36,0.5)]">
            <Crown className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">HN-Pay Hub</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">Central Identity</div>
          </div>
        </Link>

        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 shadow-[0_20px_80px_-20px_rgba(251,191,36,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "signin" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-amber-500/20 text-amber-200" : "text-neutral-400 hover:text-white"
              }`}
            >
              Create account
            </button>
          </div>

          <button
            onClick={handleGoogle}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
            <div className="h-px flex-1 bg-white/10" />
            or with email
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={<UserIcon className="h-4 w-4" />}>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
                />
              </Field>
            )}
            <Field icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                required
                placeholder="you@hn.group"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
              />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />}>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 outline-none"
              />
            </Field>

            {err && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-gradient-to-b from-amber-400/30 to-amber-500/10 py-2.5 text-sm font-semibold text-amber-100 shadow-[0_0_25px_-5px_rgba(251,191,36,0.7)] transition disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Encrypted · PCI-DSS L1 · SOC 2
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-neutral-500">
          By continuing you accept the HN Group terms.
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 focus-within:border-amber-400/50 focus-within:shadow-[0_0_0_3px_rgba(251,191,36,0.12)]">
      <span className="text-neutral-500">{icon}</span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.07-1.1-.16-1.6H12z"/>
    </svg>
  );
}
