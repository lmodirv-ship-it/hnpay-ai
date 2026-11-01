import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { pickPostLoginRoute } from "@/lib/auth/use-session";
import { Crown, Loader2, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
    app: typeof s.app === "string" ? s.app : "",
  }),
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
      // Use a full navigation so query strings (e.g. OAuth ?authorization_id=...) survive.
      if (next.includes("?")) {
        window.location.href = next;
        return;
      }
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fx-bg px-4 font-fx text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-fx-blue/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[520px] w-[520px] rounded-full bg-fx-cyan/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in_oklab,var(--fx-blue)_40%,transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in_oklab,var(--fx-blue)_40%,transparent) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-fx-blue/50 bg-fx-blue/15 shadow-[0_0_30px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
            <Crown className="h-5 w-5 text-fx-blue" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">HN-Pay Hub</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-fx-blue/80">Central Identity</div>
          </div>
        </Link>

        <div className="relative overflow-hidden rounded-3xl border border-fx-blue/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 shadow-[0_20px_80px_-20px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fx-blue/50 to-transparent" />

          <div className="mb-6 flex gap-1 rounded-xl border border-fx-line bg-fx-bg/60 p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "signin" ? "bg-fx-blue/20 text-fx-blue" : "text-fx-muted hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-fx-blue/20 text-fx-blue" : "text-fx-muted hover:text-white"
              }`}
            >
              Create account
            </button>
          </div>

          <button
            onClick={handleGoogle}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-fx-line bg-white/[0.03] py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-fx-blue/50 bg-gradient-to-b from-fx-blue/30 to-fx-blue/10 py-2.5 text-sm font-semibold text-fx-blue shadow-[0_0_25px_-5px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)] transition disabled:opacity-50"
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

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-fx-muted">
            <ShieldCheck className="h-3 w-3 text-fx-green" />
            Encrypted · PCI-DSS L1 · SOC 2
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-fx-muted">
          By continuing you accept the HN Group terms.
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-fx-line bg-fx-bg/60 px-3 py-2.5 focus-within:border-fx-blue/50 focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
      <span className="text-fx-muted">{icon}</span>
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
