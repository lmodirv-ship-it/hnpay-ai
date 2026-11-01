import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Menu, X } from "lucide-react";
import { FxPrefsContext, type Currency, type Lang } from "./fx-prefs";

const LANG_KEY = "hn-pay:lang";
const CUR_KEY = "hn-pay:currency";

const NAV: Record<Lang, { href: string; label: string }[]> = {
  ar: [
    { href: "/#overview", label: "الرئيسية" },
    { href: "/#payments", label: "حلول الدفع العالمية" },
    { href: "/#nawat", label: "جواز نواة الموحد" },
    { href: "/#developers", label: "ربط المطورين" },
    { href: "/#pricing", label: "الأسعار والعمولات" },
  ],
  fr: [
    { href: "/#overview", label: "Aperçu" },
    { href: "/#payments", label: "Paiements mondiaux" },
    { href: "/#nawat", label: "NAWAT Pass" },
    { href: "/#developers", label: "SDK Développeurs" },
    { href: "/#pricing", label: "Tarifs" },
  ],
  en: [
    { href: "/#overview", label: "Overview" },
    { href: "/#payments", label: "Global Payments" },
    { href: "/#nawat", label: "NAWAT Pass" },
    { href: "/#developers", label: "Developers SDK" },
    { href: "/#pricing", label: "Pricing" },
  ],
};

const T = {
  ar: { portal: "بوابة العميل", auth: "دخول / حساب جديد", badge: "Google-Governed Payment Gateway", rights: "جميع الحقوق محفوظة", terms: "الشروط", privacy: "الخصوصية", status: "جميع الأنظمة تعمل" },
  fr: { portal: "Espace client", auth: "Connexion / Inscription", badge: "Google-Governed Payment Gateway", rights: "Tous droits réservés", terms: "Conditions", privacy: "Confidentialité", status: "Tous les systèmes opérationnels" },
  en: { portal: "Client Portal", auth: "Sign in / Sign up", badge: "Google-Governed Payment Gateway", rights: "All rights reserved", terms: "Terms", privacy: "Privacy", status: "All systems operational" },
};

const CURRENCIES: { c: Currency; label: string }[] = [
  { c: "MAD", label: "MAD" }, { c: "EUR", label: "EUR €" }, { c: "USD", label: "USD $" }, { c: "GBP", label: "GBP £" },
];
const LANGS: { l: Lang; label: string }[] = [{ l: "ar", label: "العربية" }, { l: "fr", label: "Français" }, { l: "en", label: "English" }];

/** The single site header + footer for every public page. */
export function GlobalShell({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const [currency, setCurrency] = useState<Currency>("MAD");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const l = localStorage.getItem(LANG_KEY) as Lang | null;
    const c = localStorage.getItem(CUR_KEY) as Currency | null;
    if (l && l in T) setLang(l);
    if (c && ["MAD", "EUR", "USD", "GBP"].includes(c)) setCurrency(c);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);
  useEffect(() => { localStorage.setItem(CUR_KEY, currency); }, [currency]);

  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <FxPrefsContext.Provider value={{ lang, currency, setLang, setCurrency }}>
      <div className="fx" dir={dir}>
        <header className="sticky top-0 z-40 border-b border-fx-line bg-fx-bg/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-fx shadow-fx"><ShieldCheck className="h-5 w-5 text-fx-text" /></span>
              <span className="leading-tight">
                <span className="block font-fx-latin text-base font-bold tracking-tight">HN-Pay Live</span>
                <span className="hidden text-[10px] font-medium text-fx-cyan sm:block" dir="ltr">{t.badge}</span>
              </span>
            </Link>
            <nav className="hidden flex-1 items-center justify-center gap-5 text-sm text-fx-muted xl:flex">
              {NAV[lang].map((n) => <a key={n.href} href={n.href} className="transition-colors hover:text-fx-text">{n.label}</a>)}
            </nav>
            <div className="ms-auto hidden items-center gap-2 lg:flex">
              <div role="group" aria-label="Currency" className="flex rounded-lg border border-fx-line p-0.5 font-fx-mono text-[11px]" dir="ltr">
                {CURRENCIES.map((x) => (
                  <button key={x.c} onClick={() => setCurrency(x.c)} aria-pressed={currency === x.c}
                    className={`rounded-md px-2 py-1 ${currency === x.c ? "bg-fx-blue text-fx-text" : "text-fx-muted hover:text-fx-text"}`}>{x.label}</button>
                ))}
              </div>
              <div role="group" aria-label="Language" className="flex rounded-lg border border-fx-line p-0.5 text-[11px]">
                {LANGS.map((x) => (
                  <button key={x.l} onClick={() => setLang(x.l)} aria-pressed={lang === x.l}
                    className={`rounded-md px-2 py-1 ${lang === x.l ? "bg-fx-text/10 text-fx-text" : "text-fx-muted hover:text-fx-text"}`}>{x.label}</button>
                ))}
              </div>
              <Link to="/user/dashboard" className="rounded-lg border border-fx-line px-3 py-1.5 text-sm hover:bg-fx-text/5">{t.portal}</Link>
              <Link to="/auth" search={{ next: "", app: "" }} className="rounded-lg bg-fx-blue px-3 py-1.5 text-sm font-semibold hover:opacity-90">{t.auth}</Link>
            </div>
            <button className="ms-auto lg:hidden" aria-label="Menu" onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</button>
          </div>
          {open && (
            <div className="space-y-3 border-t border-fx-line px-5 py-4 lg:hidden">
              {NAV[lang].map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block text-sm text-fx-muted">{n.label}</a>)}
              <div className="flex flex-wrap gap-1 font-fx-mono text-xs" dir="ltr">{CURRENCIES.map((x) => <button key={x.c} onClick={() => setCurrency(x.c)} className={`rounded px-2 py-1 ${currency === x.c ? "bg-fx-blue" : "border border-fx-line"}`}>{x.label}</button>)}</div>
              <div className="flex gap-1 text-xs">{LANGS.map((x) => <button key={x.l} onClick={() => setLang(x.l)} className={`rounded px-2 py-1 ${lang === x.l ? "bg-fx-text/10" : "border border-fx-line"}`}>{x.label}</button>)}</div>
              <div className="flex gap-2"><Link to="/user/dashboard" className="flex-1 rounded-lg border border-fx-line py-2 text-center text-sm">{t.portal}</Link><Link to="/auth" search={{ next: "", app: "" }} className="flex-1 rounded-lg bg-fx-blue py-2 text-center text-sm font-semibold">{t.auth}</Link></div>
            </div>
          )}
        </header>

        <main>{children}</main>

        <footer className="border-t border-fx-line">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-fx-muted md:flex-row">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-fx-cyan" /><span className="font-fx-latin font-semibold text-fx-text">HN-Pay Live</span> · Groupe-HN © {2026} · {t.rights}</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-fx-green" />{t.status} · <span dir="ltr">hnpay.live</span></div>
            <div className="flex gap-4"><Link to="/terms">{t.terms}</Link><Link to="/privacy">{t.privacy}</Link><span>PCI-DSS</span></div>
          </div>
        </footer>
      </div>
    </FxPrefsContext.Provider>
  );
}
