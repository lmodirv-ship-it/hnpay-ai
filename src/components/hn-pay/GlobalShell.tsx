import { useEffect, useState, type ReactNode } from "react";
import { Radio, ShieldCheck, Cpu, Languages, Lock } from "lucide-react";

type Lang = "en" | "ar";

const STORAGE_KEY = "hn-pay:lang";

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem(STORAGE_KEY) as Lang) || "en";
}

export function GlobalShell({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [syncing, setSyncing] = useState(false);
  const [tokens, setTokens] = useState(12);

  useEffect(() => {
    setLang(readLang());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.style.fontFamily =
      lang === "ar"
        ? "'Cairo', 'Inter', ui-sans-serif, system-ui"
        : "'Inter', ui-sans-serif, system-ui";
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  // Global vault-sync overlay: triggered on any checkout/subscribe/confirm click
  useEffect(() => {
    if (typeof window === "undefined") return;
    const triggers = [
      "activate plan",
      "confirm secure",
      "confirm transaction",
      "deploy nova",
      "تفعيل الخطة",
      "تأكيد المعاملة",
      "نشر عقدة",
      "checkout",
      "subscribe",
      "pay now",
    ];
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button, a") as HTMLElement | null;
      if (!btn) return;
      const text = (btn.textContent || "").trim().toLowerCase();
      if (!text) return;
      if (triggers.some((k) => text.includes(k))) {
        setSyncing(true);
        setTokens((t) => Math.min(50, t + 1));
        window.setTimeout(() => setSyncing(false), 1900);
      }
    };
    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, []);

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const pct = Math.round((tokens / 50) * 100);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#04050a] via-[#080914] to-[#020205] text-white">
      {/* Atmospheric glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-amber-500/10 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[160px]" />
        <div className="absolute left-1/2 top-1/3 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-violet-600/5 blur-[160px]" />
      </div>

      {/* Global Status Bar */}
      <div className="relative z-40 border-b border-white/5 bg-[#04050a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-1.5 text-[11px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              </span>
              <span className="font-mono text-emerald-300/90">
                ● Core Node: Connected to 192.168.100.233:8181
              </span>
            </div>
            <span className="hidden text-white/20 md:inline">|</span>
            <span className="hidden font-mono text-white/40 md:inline">
              HN-Cluster · 149 nodes online · latency 12ms
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/5 px-2 py-0.5 text-emerald-300 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              {t("Active Shield V4.8", "الحماية V4.8")}
            </span>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="group inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/[0.06] px-2.5 py-0.5 font-semibold text-amber-200 shadow-[0_0_18px_-6px_rgba(251,191,36,0.6)] transition hover:border-amber-300/60 hover:bg-amber-400/10"
            >
              <Languages className="h-3 w-3" />
              {lang === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
      </div>

      {/* Main app */}
      <div className="relative z-10">{children}</div>

      {/* Floating Resource HUD */}
      <div className="pointer-events-none fixed bottom-4 z-40 hidden w-[280px] md:block"
           style={lang === "ar" ? { left: "1rem" } : { right: "1rem" }}>
        <div className="pointer-events-auto rounded-2xl border border-white/5 bg-[#0d0f1d]/60 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-amber-300" />
              {t("Token Pool", "رصيد الوحدات")}
            </span>
            <span className="font-mono text-amber-200">{tokens} / 50</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 shadow-[0_0_16px_rgba(251,191,36,0.9)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400/40 blur-md transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
            <span className="inline-flex items-center gap-1 text-emerald-300/80">
              <Lock className="h-3 w-3" />
              {t("FireShield · Rate-Limited", "درع الحماية · محدود المعدل")}
            </span>
            <span className="font-mono">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#04050a]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-6 py-6 text-center">
          <div className="text-[11px] uppercase tracking-[0.35em] text-amber-300/70">
            HN · Ecosystem Cluster
          </div>
          <div className="mt-2 text-xs text-white/60">
            © {new Date().getFullYear()} — {t(
              "All rights reserved to El Hassani Moulay Ismail",
              "جميع الحقوق محفوظة للحسني مولاي إسماعيل",
            )}
          </div>
          <div className="mt-1 text-[11px] text-white/40">
            {t("HN Group — Design & Software", "مجموعة HN للتصميم والبرمجيات")}
          </div>
        </div>
      </footer>

      {/* Vault Sync Overlay */}
      {syncing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative w-[min(92vw,460px)] overflow-hidden rounded-3xl border border-amber-400/30 bg-[#0d0f1d]/80 p-8 text-center shadow-[0_0_80px_-20px_rgba(251,191,36,0.6)] backdrop-blur-2xl">
            <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-400/20 blur-[100px]" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/10 shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                <ShieldCheck className="h-8 w-8 text-amber-300" />
              </div>
              <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.4em] text-amber-300/80">
                HN-Pay Vault
              </div>
              <div className="mt-3 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-lg font-bold text-transparent">
                Syncing Secure Session with HN-DB Central
              </div>
              <div className="mt-1 text-sm text-amber-200/70" dir="rtl">
                جاري مزامنة الجلسة الآمنة مع قاعدة البيانات
              </div>
              <div className="mx-auto mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_18px_rgba(251,191,36,0.8)]" />
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300/80">
                <Radio className="h-3 w-3" />
                TLS 1.3 · Node 192.168.100.233:8181
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}