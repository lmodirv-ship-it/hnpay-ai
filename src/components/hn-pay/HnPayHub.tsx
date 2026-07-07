import { useMemo, useState, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  Check,
  Crown,
  Lock,
  CreditCard,
  Loader2,
  CheckCircle2,
  X,
  Radio,
  Receipt,
  Rocket,
  Infinity as InfinityIcon,
  Zap,
  TrendingUp,
  Users,
  Wallet,
  Landmark,
  Languages,
  ArrowUpRight,
  Download,
  Search,
  Diamond,
} from "lucide-react";

/* ─────────────────────────── i18n ─────────────────────────── */

type Lang = "en" | "ar";

const T = {
  brand: { en: "HN-PAY", ar: "اتش إن ـ باي" },
  tagline: {
    en: "Private Billing & Subscriptions Vault",
    ar: "خزنة الفوترة والاشتراكات الخاصة",
  },
  nodeStatus: {
    en: "Vault Node · Connected",
    ar: "عقدة الخزنة · متصلة",
  },
  overview: { en: "Financial Overview", ar: "النظرة المالية" },
  overviewSub: {
    en: "Real-time treasury across the HN network.",
    ar: "الخزينة اللحظية عبر شبكة HN.",
  },
  totalEarnings: { en: "Total Earnings", ar: "إجمالي الأرباح" },
  activeSubs: { en: "Active Subscriptions", ar: "الاشتراكات النشطة" },
  mrr: { en: "Monthly Recurring", ar: "الإيراد الشهري المتكرر" },
  churn: { en: "Churn Rate (30d)", ar: "معدل الإلغاء (٣٠ي)" },
  vsLast: { en: "vs last month", ar: "مقارنة بالشهر الماضي" },
  plans: { en: "Subscription Tiers", ar: "طبقات الاشتراك" },
  plansSub: {
    en: "Curated for premium workloads.",
    ar: "مصمّمة لأعباء العمل الفاخرة.",
  },
  activatePlan: { en: "Activate Plan", ar: "تفعيل الخطة" },
  deployNova: { en: "Deploy Nova Node", ar: "نشر عقدة نوفا" },
  mostPopular: { en: "★ Most Popular", ar: "★ الأكثر طلباً" },
  maxMode: { en: "MAX Processing Mode", ar: "وضع المعالجة القصوى" },
  perMonth: { en: "/ month", ar: "/ شهرياً" },
  invoices: { en: "Invoice Ledger", ar: "سجل الفواتير" },
  entries: { en: "entries", ar: "قيود" },
  invoiceId: { en: "Invoice ID", ar: "رقم الفاتورة" },
  date: { en: "Date", ar: "التاريخ" },
  description: { en: "Description", ar: "الوصف" },
  amount: { en: "Amount", ar: "المبلغ" },
  status: { en: "Status", ar: "الحالة" },
  paid: { en: "Paid", ar: "مدفوعة" },
  encStamp: { en: "SUCCESSFULLY ENCRYPTED", ar: "تم التشفير بنجاح" },
  vaultTitle: { en: "3D Vault · Live Session", ar: "الخزنة ثلاثية الأبعاد · جلسة حيّة" },
  vaultSub: {
    en: "Neon credit card, token treasury and encrypted expense telemetry.",
    ar: "بطاقة نيون ائتمانية، خزينة توكنز وقياسات مصاريف مشفّرة.",
  },
  tokenBalance: { en: "Token Balance", ar: "رصيد التوكنز" },
  spendFlow: { en: "Spend Flow · 30d", ar: "تدفق الإنفاق · ٣٠ي" },
  buyTokens: { en: "Buy Tokens Pack", ar: "شراء حزمة توكنز" },
  renewPlan: { en: "Renew SaaS Plan", ar: "تجديد باقة الاشتراك" },
  cryptoSync: { en: "Sync Crypto Wallet", ar: "ربط محفظة الكريبتو" },
  dialUsage: { en: "Token Usage", ar: "استهلاك التوكنز" },
  dialSavings: { en: "Cost Savings", ar: "التوفير المالي" },
  dialSecurity: { en: "Security Index", ar: "مؤشر الأمان" },
  liveEncrypt: { en: "Live bank-grade encryption", ar: "تشفير مصرفي مباشر" },
  search: { en: "Search invoices…", ar: "ابحث في الفواتير…" },
  export: { en: "Export", ar: "تصدير" },
  context: { en: "Active Portfolio", ar: "المحفظة النشطة" },
  confirmTx: { en: "Confirm Transaction", ar: "تأكيد المعاملة" },
  cardholder: { en: "Cardholder Name", ar: "اسم صاحب البطاقة" },
  cardNumber: { en: "Card Number", ar: "رقم البطاقة" },
  expiry: { en: "Expiry (MM/YY)", ar: "الانتهاء (ش/س)" },
  cvv: { en: "CVV", ar: "رمز الأمان" },
  totalDue: { en: "Total due today", ar: "المستحق الآن" },
  secureGw: { en: "Secure Gateway · TLS 1.3", ar: "بوابة مؤمّنة · TLS 1.3" },
  confirmSecure: { en: "Confirm Secure Transaction", ar: "تأكيد المعاملة الآمنة" },
  encrypted: {
    en: "Encrypted end-to-end via HN-Pay Vault",
    ar: "تشفير شامل عبر خزنة HN-Pay",
  },
  processing: { en: "Processing Transaction…", ar: "جاري تنفيذ المعاملة…" },
  paymentSuccess: { en: "Payment Successful", ar: "تمت المعاملة بنجاح" },
  returnPortal: { en: "Return to Portal", ar: "العودة إلى البوابة" },
  footerCompliance: {
    en: "PCI-DSS L1 · SOC2 Type II · ISO/IEC 27001",
    ar: "معتمد PCI-DSS L1 · SOC2 Type II · ISO/IEC 27001",
  },
  footerCopy: {
    en: "© 2026 HN-Pay Hub · All rights reserved to Al-Hasani Moulay Ismail — HN Group · Design & Software.",
    ar: "© ٢٠٢٦ HN-Pay Hub · جميع الحقوق محفوظة للحسني مولاي إسماعيل — مجموعة HN للتصميم والبرمجيات.",
  },
  ownerConsole: { en: "Open Owner Console", ar: "فتح لوحة المالك" },
};

/* ─────────────────────────── Data ─────────────────────────── */

type AppId = "HN-BUILD" | "FILMFORGE" | "HN-LAVAGE";

interface AppContext {
  id: AppId;
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  totalEarnings: number;
  activeSubs: number;
  mrr: number;
  churn: number;
  earningsDelta: number;
  subsDelta: number;
  activePlan: { en: string; ar: string };
  features: {
    basic: { en: string[]; ar: string[] };
    pro: { en: string[]; ar: string[] };
    enterprise: { en: string[]; ar: string[] };
  };
  invoices: {
    id: string;
    date: string;
    label: { en: string; ar: string };
    amount: number;
  }[];
}

const APPS: Record<AppId, AppContext> = {
  "HN-BUILD": {
    id: "HN-BUILD",
    name: { en: "HN-BUILD", ar: "HN-BUILD" },
    tagline: { en: "No-Code Site Compiler", ar: "مُجمّع مواقع بدون كود" },
    totalEarnings: 128420,
    activeSubs: 1284,
    mrr: 18320,
    churn: 1.4,
    earningsDelta: 12.4,
    subsDelta: 8.2,
    activePlan: { en: "Pro Builder", ar: "برو بيلدر" },
    features: {
      basic: {
        en: ["3 Live Sites", "Community Templates", "Basic Analytics", "Standard CDN"],
        ar: ["٣ مواقع مباشرة", "قوالب مجتمعية", "تحليلات أساسية", "شبكة CDN قياسية"],
      },
      pro: {
        en: ["50 Live Sites", "AI Layout Engine", "Priority Deploy Queue", "Custom Domains", "Advanced SEO"],
        ar: ["٥٠ موقعاً مباشراً", "محرك تصميم بالذكاء", "أولوية النشر", "نطاقات مخصصة", "SEO متقدم"],
      },
      enterprise: {
        en: ["Unlimited Sites", "Dedicated Build Nodes", "White-Label Portal", "SSO & Audit Logs", "24/7 Sovereign Support"],
        ar: ["مواقع غير محدودة", "عقد بناء مخصصة", "بوابة بعلامتك", "SSO وسجلات تدقيق", "دعم سيادي ٢٤/٧"],
      },
    },
    invoices: [
      { id: "HNB-8842", date: "2026-06-01", label: { en: "Pro Builder — Monthly", ar: "برو بيلدر — شهري" }, amount: 49 },
      { id: "HNB-8721", date: "2026-05-01", label: { en: "Pro Builder — Monthly", ar: "برو بيلدر — شهري" }, amount: 49 },
      { id: "HNB-8610", date: "2026-04-01", label: { en: "Domain Pack Add-on", ar: "حزمة نطاقات إضافية" }, amount: 12 },
      { id: "HNB-8501", date: "2026-03-01", label: { en: "Pro Builder — Monthly", ar: "برو بيلدر — شهري" }, amount: 49 },
    ],
  },
  FILMFORGE: {
    id: "FILMFORGE",
    name: { en: "FILMFORGE", ar: "فيلم فورج" },
    tagline: { en: "Cinematic Render Cloud", ar: "سحابة العرض السينمائي" },
    totalEarnings: 342180,
    activeSubs: 892,
    mrr: 41280,
    churn: 0.9,
    earningsDelta: 24.1,
    subsDelta: 14.6,
    activePlan: { en: "Director Suite", ar: "جناح المخرج" },
    features: {
      basic: {
        en: ["720p Renders", "10 Projects", "Standard Codecs", "Watermarked Exports"],
        ar: ["عرض 720p", "١٠ مشاريع", "برامج ترميز قياسية", "تصدير بعلامة مائية"],
      },
      pro: {
        en: ["4K HDR Renders", "120 Projects / mo", "AI Color Grading", "No Watermark", "Timeline Collab"],
        ar: ["عرض 4K HDR", "١٢٠ مشروع/شهر", "تدرج لوني بالذكاء", "بدون علامة مائية", "تعاون على الخط الزمني"],
      },
      enterprise: {
        en: ["8K IMAX Pipeline", "Unlimited Render Farm", "Custom LUT Vault", "Studio SSO", "On-Set Support"],
        ar: ["خط إنتاج 8K IMAX", "مزرعة عرض غير محدودة", "خزنة LUT مخصصة", "SSO للاستوديو", "دعم في الموقع"],
      },
    },
    invoices: [
      { id: "FFG-2201", date: "2026-06-04", label: { en: "Director Suite — Monthly", ar: "جناح المخرج — شهري" }, amount: 129 },
      { id: "FFG-2140", date: "2026-05-04", label: { en: "Extra Render Pack", ar: "حزمة عرض إضافية" }, amount: 39 },
      { id: "FFG-2088", date: "2026-04-04", label: { en: "Director Suite — Monthly", ar: "جناح المخرج — شهري" }, amount: 129 },
      { id: "FFG-2010", date: "2026-03-04", label: { en: "Director Suite — Monthly", ar: "جناح المخرج — شهري" }, amount: 129 },
    ],
  },
  "HN-LAVAGE": {
    id: "HN-LAVAGE",
    name: { en: "HN-LAVAGE", ar: "HN-LAVAGE" },
    tagline: { en: "Fleet Wash Operations API", ar: "واجهة عمليات غسيل الأساطيل" },
    totalEarnings: 89640,
    activeSubs: 412,
    mrr: 12040,
    churn: 2.1,
    earningsDelta: 6.8,
    subsDelta: 4.3,
    activePlan: { en: "Fleet Ops", ar: "عمليات الأسطول" },
    features: {
      basic: {
        en: ["1 Location", "5k API Calls / mo", "Email Alerts", "Basic Dashboard"],
        ar: ["موقع واحد", "٥ آلاف نداء/شهر", "تنبيهات بالبريد", "لوحة أساسية"],
      },
      pro: {
        en: ["10 Locations", "250k API Calls / mo", "SMS + Webhook Alerts", "Loyalty Engine", "Route Optimizer"],
        ar: ["١٠ مواقع", "٢٥٠ ألف نداء/شهر", "تنبيهات SMS وويب هوك", "محرك ولاء", "محسّن مسارات"],
      },
      enterprise: {
        en: ["Unlimited Locations", "Private API Cluster", "Custom SLA 99.99%", "Fleet Telemetry Vault", "Dedicated CSM"],
        ar: ["مواقع غير محدودة", "عنقود API خاص", "SLA مخصص ٩٩٫٩٩٪", "خزنة قياسات الأسطول", "مدير حساب مخصص"],
      },
    },
    invoices: [
      { id: "HNL-5511", date: "2026-06-02", label: { en: "Fleet Ops — Monthly", ar: "عمليات الأسطول — شهري" }, amount: 89 },
      { id: "HNL-5470", date: "2026-05-02", label: { en: "Fleet Ops — Monthly", ar: "عمليات الأسطول — شهري" }, amount: 89 },
      { id: "HNL-5433", date: "2026-04-15", label: { en: "Extra Call Pack 100k", ar: "حزمة ١٠٠ألف نداء إضافي" }, amount: 25 },
      { id: "HNL-5401", date: "2026-04-02", label: { en: "Fleet Ops — Monthly", ar: "عمليات الأسطول — شهري" }, amount: 89 },
    ],
  },
};

type PlanTier = "basic" | "pro" | "enterprise";
const PLAN_PRICES: Record<PlanTier, number> = { basic: 19, pro: 49, enterprise: 249 };
const PLAN_NAMES: Record<PlanTier, { en: string; ar: string }> = {
  basic: { en: "Basic Vault", ar: "الخزنة الأساسية" },
  pro: { en: "Pro Signal", ar: "بلاتين برو" },
  enterprise: { en: "Enterprise Nova", ar: "نوفا للمؤسسات" },
};
const PLAN_SUB: Record<PlanTier, { en: string; ar: string }> = {
  basic: { en: "Entry vault access", ar: "دخول أساسي للخزنة" },
  pro: { en: "Most chosen by the network", ar: "الأكثر اختياراً في الشبكة" },
  enterprise: { en: "Sovereign · titanium tier", ar: "سيادي · طبقة تيتانيوم" },
};

/* ─────────────────────── Root Component ─────────────────────── */

export function HnPayHub() {
  const [lang, setLang] = useState<Lang>("en");
  const [appId, setAppId] = useState<AppId>("HN-BUILD");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanTier | null>(null);
  const [query, setQuery] = useState("");
  const app = APPS[appId];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = (k: keyof typeof T) => T[k][lang];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("appId");
    if (q && (q === "HN-BUILD" || q === "FILMFORGE" || q === "HN-LAVAGE")) {
      setAppId(q);
    }
    const l = params.get("lang");
    if (l === "ar" || l === "en") setLang(l);
  }, []);

  const kpis = useMemo(() => {
    const totals = Object.values(APPS).reduce(
      (acc, a) => {
        acc.earnings += a.totalEarnings;
        acc.subs += a.activeSubs;
        acc.mrr += a.mrr;
        return acc;
      },
      { earnings: 0, subs: 0, mrr: 0 }
    );
    return totals;
  }, []);

  return (
    <div
      dir={dir}
      lang={lang}
      className="relative min-h-screen overflow-hidden bg-[#050505] text-neutral-200 antialiased"
      style={{
        fontFamily: lang === "ar" ? "'Cairo','Tajawal',ui-sans-serif,system-ui" : "'Inter',ui-sans-serif,system-ui",
      }}
    >
      {/* Obsidian atmospheric layers */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 15% -10%, rgba(212,175,55,0.14), transparent 60%), radial-gradient(900px 600px at 100% 0%, rgba(212,175,55,0.06), transparent 55%), radial-gradient(800px 800px at 50% 120%, rgba(60,50,20,0.35), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(212,175,55,0.35) 1px, transparent 0)",
          backgroundSize: "42px 42px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 60%, #050505 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <TopBar lang={lang} setLang={setLang} t={t} />
        <HeroDashboard app={app} lang={lang} t={t} kpis={kpis} appId={appId} setAppId={setAppId} />
        <Vault3D app={app} lang={lang} t={t} onChoose={setCheckoutPlan} />
        <PricingGrid app={app} lang={lang} t={t} onChoose={setCheckoutPlan} />
        <InvoiceLedger app={app} lang={lang} t={t} query={query} setQuery={setQuery} />

        <footer className="mt-16 flex flex-col items-center gap-3 border-t border-amber-500/10 pt-8 text-center text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
            <span>{t("footerCompliance")}</span>
          </div>
          <a
            href="/console"
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/[0.06] px-4 py-1.5 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/15"
          >
            <Crown className="h-3 w-3" />
            {t("ownerConsole")}
          </a>
          <div>{t("footerCopy")}</div>
        </footer>
      </div>

      {checkoutPlan && (
        <CheckoutOverlay
          appId={appId}
          plan={checkoutPlan}
          lang={lang}
          t={t}
          onClose={() => setCheckoutPlan(null)}
        />
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
      `}</style>
    </div>
  );
}

/* ─────────────────────────── TopBar ─────────────────────────── */

function TopBar({
  lang,
  setLang,
  t,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof T) => string;
}) {
  return (
    <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-yellow-700/5 shadow-[0_0_30px_rgba(212,175,55,0.35)]">
          <Diamond className="h-6 w-6 text-amber-300" strokeWidth={2} />
          <div className="absolute inset-0 rounded-xl bg-amber-400/10 blur-md" />
        </div>
        <div>
          <h1 className="text-2xl font-black leading-none tracking-tight bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            {t("brand")}
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-neutral-500">
            {t("tagline")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 shadow-[0_0_25px_rgba(16,185,129,0.08)] backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono text-[11px] text-emerald-300">{t("nodeStatus")}</span>
        </div>

        <a
          href="/auth"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-400/25 to-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-100 shadow-[0_0_20px_-5px_rgba(251,191,36,0.6)] transition hover:from-amber-400/35"
        >
          <Lock className="h-3.5 w-3.5" />
          {lang === "ar" ? "دخول الحساب" : "Sign in"}
        </a>

        <div className="inline-flex items-center overflow-hidden rounded-xl border border-amber-500/25 bg-black/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] backdrop-blur-xl">
          <Languages className="mx-2.5 h-3.5 w-3.5 text-amber-300/80" />
          {(["en", "ar"] as Lang[]).map((l) => {
            const active = lang === l;
            return (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={[
                  "px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all",
                  active
                    ? "bg-gradient-to-b from-amber-400 to-yellow-600 text-black shadow-[inset_0_0_10px_rgba(255,220,120,0.6)]"
                    : "text-neutral-400 hover:text-amber-200",
                ].join(" ")}
                style={{ fontFamily: l === "ar" ? "'Cairo',ui-sans-serif" : "'Inter',ui-sans-serif" }}
              >
                {l === "en" ? "EN" : "عربي"}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

/* ───────────────────── Hero Dashboard (KPIs) ───────────────────── */

function HeroDashboard({
  app,
  lang,
  t,
  kpis,
  appId,
  setAppId,
}: {
  app: AppContext;
  lang: Lang;
  t: (k: keyof typeof T) => string;
  kpis: { earnings: number; subs: number; mrr: number };
  appId: AppId;
  setAppId: (a: AppId) => void;
}) {
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  const fmtInt = (n: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(n);

  const apps: AppId[] = ["HN-BUILD", "FILMFORGE", "HN-LAVAGE"];

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-amber-300/70">
            <Sparkles className="h-3 w-3" />
            {t("overview")}
          </div>
          <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
            <span className="bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              {app.name[lang]}
            </span>{" "}
            <span className="text-neutral-400">·</span>{" "}
            <span className="text-neutral-300">{app.tagline[lang]}</span>
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{t("overviewSub")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            {t("context")}
          </span>
          {apps.map((a) => {
            const active = a === appId;
            return (
              <button
                key={a}
                onClick={() => setAppId(a)}
                className={[
                  "rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-all",
                  active
                    ? "border-amber-400/60 bg-gradient-to-b from-amber-500/20 to-amber-800/10 text-amber-200 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                    : "border-amber-500/10 bg-white/[0.02] text-neutral-400 hover:border-amber-500/30 hover:text-amber-200",
                ].join(" ")}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          label={t("totalEarnings")}
          value={fmtMoney(app.totalEarnings)}
          delta={app.earningsDelta}
          icon={<Wallet className="h-5 w-5" />}
          sub={`${t("vsLast")}`}
          lang={lang}
        />
        <KpiCard
          label={t("activeSubs")}
          value={fmtInt(app.activeSubs)}
          delta={app.subsDelta}
          icon={<Users className="h-5 w-5" />}
          sub={`${t("vsLast")}`}
          lang={lang}
        />
        <KpiCard
          label={t("mrr")}
          value={fmtMoney(app.mrr)}
          delta={app.earningsDelta / 2}
          icon={<TrendingUp className="h-5 w-5" />}
          sub={`${t("vsLast")}`}
          lang={lang}
        />
        <KpiCard
          label={t("churn")}
          value={`${app.churn.toFixed(1)}%`}
          delta={-0.3}
          icon={<Landmark className="h-5 w-5" />}
          sub={`${t("vsLast")}`}
          inverse
          lang={lang}
        />
      </div>

      {/* Network totals strip */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-amber-500/10 bg-black/40 px-5 py-3 text-xs text-neutral-400 backdrop-blur-xl">
        <span className="font-mono uppercase tracking-widest text-amber-300/70">
          Σ HN-Network
        </span>
        <span>
          {t("totalEarnings")}:{" "}
          <span className="font-mono text-amber-200">{fmtMoney(kpis.earnings)}</span>
        </span>
        <span>
          {t("activeSubs")}:{" "}
          <span className="font-mono text-amber-200">{fmtInt(kpis.subs)}</span>
        </span>
        <span>
          {t("mrr")}: <span className="font-mono text-amber-200">{fmtMoney(kpis.mrr)}</span>
        </span>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon,
  sub,
  featured,
  inverse,
  lang,
}: {
  label: string;
  value: string;
  delta: number;
  icon: React.ReactNode;
  sub: string;
  featured?: boolean;
  inverse?: boolean;
  lang: Lang;
}) {
  const positive = inverse ? delta <= 0 : delta >= 0;
  const deltaStr =
    new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
      signDisplay: "always",
      maximumFractionDigits: 1,
    }).format(delta) + "%";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl transition-all",
        featured
          ? "border border-amber-400/40 bg-gradient-to-br from-amber-500/[0.08] via-black/60 to-black/80 shadow-[0_0_40px_rgba(212,175,55,0.25)] hover:shadow-[0_0_55px_rgba(212,175,55,0.4)]"
          : "border border-amber-500/10 bg-black/50 shadow-[0_0_25px_rgba(0,0,0,0.5)] hover:border-amber-500/25",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl transition-opacity group-hover:opacity-70" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {label}
          </div>
          <div
            className={[
              "mt-2 text-3xl font-black tracking-tight md:text-4xl",
              featured
                ? "bg-gradient-to-b from-amber-100 to-yellow-500 bg-clip-text text-transparent"
                : "text-white",
            ].join(" ")}
          >
            {value}
          </div>
        </div>
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            featured
              ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
              : "border-amber-500/15 bg-amber-500/[0.04] text-amber-300/80",
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono",
            positive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300",
          ].join(" ")}
        >
          <ArrowUpRight
            className={["h-3 w-3", positive ? "" : "rotate-90"].join(" ")}
          />
          {deltaStr}
        </span>
        <span className="text-neutral-500">{sub}</span>
      </div>
    </div>
  );
}

/* ───────────────────────── Pricing Grid ────────────────────────── */

function PricingGrid({
  app,
  lang,
  t,
  onChoose,
}: {
  app: AppContext;
  lang: Lang;
  t: (k: keyof typeof T) => string;
  onChoose: (p: PlanTier) => void;
}) {
  return (
    <section className="mt-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-amber-300/70">
            {t("plans")}
          </div>
          <h3 className="mt-1 text-2xl font-bold text-white">
            {app.name[lang]} · {t("plansSub")}
          </h3>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PricingCard
          tier="basic"
          price={PLAN_PRICES.basic}
          title={PLAN_NAMES.basic[lang]}
          subtitle={PLAN_SUB.basic[lang]}
          icon={<Zap className="h-5 w-5" />}
          features={app.features.basic[lang]}
          cta={t("activatePlan")}
          onChoose={() => onChoose("basic")}
          badge={undefined}
        />
        <PricingCard
          tier="pro"
          price={PLAN_PRICES.pro}
          title={PLAN_NAMES.pro[lang]}
          subtitle={PLAN_SUB.pro[lang]}
          icon={<Crown className="h-5 w-5" />}
          features={app.features.pro[lang]}
          featured
          cta={t("activatePlan")}
          onChoose={() => onChoose("pro")}
          badge={t("mostPopular")}
        />
        <PricingCard
          tier="enterprise"
          price={PLAN_PRICES.enterprise}
          title={PLAN_NAMES.enterprise[lang]}
          subtitle={PLAN_SUB.enterprise[lang]}
          icon={<InfinityIcon className="h-5 w-5" />}
          features={app.features.enterprise[lang]}
          enterprise
          cta={t("deployNova")}
          onChoose={() => onChoose("enterprise")}
          badge={t("maxMode")}
        />
      </div>
    </section>
  );
}

function PricingCard({
  price,
  title,
  subtitle,
  icon,
  features,
  featured,
  enterprise,
  cta,
  onChoose,
  badge,
}: {
  tier: PlanTier;
  price: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features: string[];
  featured?: boolean;
  enterprise?: boolean;
  cta: string;
  onChoose: () => void;
  badge?: string;
}) {
  const base =
    "group relative flex flex-col rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1";
  const style = featured
    ? "border border-amber-400/50 bg-gradient-to-b from-amber-500/[0.10] via-black/70 to-black/90 shadow-[0_0_35px_rgba(212,175,55,0.35)] hover:shadow-[0_0_55px_rgba(212,175,55,0.55)]"
    : enterprise
      ? "border border-amber-500/15 bg-gradient-to-b from-neutral-950/80 to-black/95 shadow-[0_0_25px_rgba(0,0,0,0.6)] hover:border-amber-400/30"
      : "border border-amber-500/10 bg-black/50 shadow-[0_0_25px_rgba(0,0,0,0.5)] hover:border-amber-500/30 hover:shadow-[0_0_35px_rgba(212,175,55,0.15)]";

  return (
    <div className={`${base} ${style}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={[
              "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.5)]",
              featured
                ? "border-amber-400/60 bg-gradient-to-r from-amber-400 to-yellow-500 text-black"
                : "border-amber-500/30 bg-black/80 font-mono text-amber-300/90",
            ].join(" ")}
          >
            {badge}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            featured
              ? "border-amber-400/50 bg-amber-500/10 text-amber-300"
              : enterprise
                ? "border-amber-500/25 bg-black/60 text-amber-200"
                : "border-amber-500/20 bg-amber-500/[0.05] text-amber-300/90",
          ].join(" ")}
        >
          {icon}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{title}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-sm text-neutral-500">$</span>
        <span
          className={[
            "text-5xl font-black tracking-tight",
            featured
              ? "bg-gradient-to-b from-amber-100 to-yellow-500 bg-clip-text text-transparent"
              : "text-white",
          ].join(" ")}
        >
          {price}
        </span>
        <span className="ml-1 text-sm text-neutral-500">{T.perMonth.en}</span>
      </div>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <ul className="mt-5 space-y-3 text-sm text-neutral-300">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span
              className={[
                "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full",
                featured
                  ? "bg-amber-500/25 text-amber-200"
                  : "bg-amber-500/15 text-amber-300/90",
              ].join(" ")}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span className="leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
        className={[
          "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
          featured
            ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_30px_rgba(212,175,55,0.55)] hover:shadow-[0_0_45px_rgba(212,175,55,0.8)]"
            : enterprise
              ? "border border-amber-500/30 bg-black/60 text-amber-100 hover:bg-amber-500/10"
              : "border border-amber-500/25 bg-amber-500/[0.05] text-amber-200 hover:bg-amber-500/10",
        ].join(" ")}
      >
        <Rocket className="h-4 w-4" />
        {cta}
      </button>
    </div>
  );
}

/* ─────────────────────── Invoice Ledger ─────────────────────── */

function InvoiceLedger({
  app,
  lang,
  t,
  query,
  setQuery,
}: {
  app: AppContext;
  lang: Lang;
  t: (k: keyof typeof T) => string;
  query: string;
  setQuery: (s: string) => void;
}) {
  const filtered = app.invoices.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      i.id.toLowerCase().includes(q) ||
      i.label[lang].toLowerCase().includes(q) ||
      i.date.includes(q)
    );
  });

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <section className="mt-14 overflow-hidden rounded-2xl border border-amber-500/15 bg-black/50 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-amber-500/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-200">
            {t("invoices")}
          </h3>
          <span className="font-mono text-[11px] text-neutral-500">
            · {filtered.length} {t("entries")} · {app.name[lang]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500"
              style={{ [lang === "ar" ? "right" : "left"]: "0.625rem" } as React.CSSProperties} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className={[
                "w-56 rounded-lg border border-amber-500/15 bg-black/60 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20",
                lang === "ar" ? "pr-8 pl-3 text-right" : "pl-8 pr-3",
              ].join(" ")}
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/10">
            <Download className="h-3.5 w-3.5" />
            {t("export")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={["text-[10px] uppercase tracking-[0.2em] text-neutral-500", lang === "ar" ? "text-right" : "text-left"].join(" ")}>
              <th className="px-6 py-3 font-medium">{t("invoiceId")}</th>
              <th className="px-6 py-3 font-medium">{t("date")}</th>
              <th className="px-6 py-3 font-medium">{t("description")}</th>
              <th className={["px-6 py-3 font-medium", lang === "ar" ? "text-left" : "text-right"].join(" ")}>{t("amount")}</th>
              <th className={["px-6 py-3 font-medium", lang === "ar" ? "text-left" : "text-right"].join(" ")}>{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-500/5">
            {filtered.map((inv) => (
              <tr key={inv.id} className="transition-colors hover:bg-amber-500/[0.03]">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-semibold text-amber-300">
                    #{inv.id}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-neutral-400">{inv.date}</td>
                <td className="px-6 py-4 text-neutral-200">{inv.label[lang]}</td>
                <td className={["px-6 py-4 font-mono font-semibold text-white", lang === "ar" ? "text-left" : "text-right"].join(" ")}>
                  {fmtMoney(inv.amount)}
                </td>
                <td className={["px-6 py-4", lang === "ar" ? "text-left" : "text-right"].join(" ")}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300 shadow-[0_0_22px_rgba(16,185,129,0.5)]">
                    <ShieldCheck className="h-3 w-3 drop-shadow-[0_0_6px_rgba(16,185,129,1)]" />
                    {t("encStamp")}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─────────────────────── Checkout Overlay ─────────────────────── */

function CheckoutOverlay({
  appId,
  plan,
  lang,
  t,
  onClose,
}: {
  appId: AppId;
  plan: PlanTier;
  lang: Lang;
  t: (k: keyof typeof T) => string;
  onClose: () => void;
}) {
  const [state, setState] = useState<"form" | "processing" | "success">("form");
  const [cardName, setCardName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const price = PLAN_PRICES[plan];
  const planName = PLAN_NAMES[plan][lang];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setState("processing");
    setTimeout(() => {
      setState("success");
      if (typeof window !== "undefined") {
        window.parent.postMessage(
          { status: "PAYMENT_SUCCESS", appId, planId: plan },
          "*"
        );
      }
    }, 2000);
  };

  const fmtCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-black/95 to-neutral-950/95 shadow-[0_0_60px_rgba(212,175,55,0.35)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-amber-500/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-700/20 blur-[100px]" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-black/60 text-neutral-400 transition hover:text-amber-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-8">
          {state === "form" && (
            <>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-amber-300/70">
                <Lock className="h-3 w-3" />
                {t("secureGw")}
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">{t("confirmTx")}</h3>
              <p className="mt-1 text-sm text-neutral-400">
                {planName} — <span className="text-amber-300">{appId}</span>
              </p>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
                <span className="text-sm text-neutral-300">{t("totalDue")}</span>
                <span className="font-mono text-2xl font-black text-amber-300">
                  ${price}.00
                </span>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field label={t("cardholder")}>
                  <input
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="H. Nova"
                    className="w-full rounded-lg border border-amber-500/15 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                </Field>
                <Field label={t("cardNumber")}>
                  <div className="relative">
                    <input
                      required
                      value={cardNum}
                      onChange={(e) => setCardNum(fmtCard(e.target.value))}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full rounded-lg border border-amber-500/15 bg-black/60 px-3 py-2.5 pr-10 font-mono text-sm tracking-widest text-white placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                    <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-300/60" />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("expiry")}>
                    <input
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                      placeholder="09/28"
                      className="w-full rounded-lg border border-amber-500/15 bg-black/60 px-3 py-2.5 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                  </Field>
                  <Field label={t("cvv")}>
                    <input
                      required
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      className="w-full rounded-lg border border-amber-500/15 bg-black/60 px-3 py-2.5 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 text-sm font-bold text-black shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all hover:shadow-[0_0_45px_rgba(212,175,55,0.85)]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t("confirmSecure")}
                </button>
                <p className="text-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                  {t("encrypted")}
                </p>
              </form>
            </>
          )}

          {state === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl" />
                <Loader2 className="relative h-16 w-16 animate-spin text-amber-300" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">{t("processing")}</h3>
              <div className="mt-4 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_45px_rgba(16,185,129,0.6)]">
                  <CheckCircle2 className="h-10 w-10 text-emerald-300" strokeWidth={2.2} />
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-white">{t("paymentSuccess")}</h3>
              <p className="mt-2 text-sm text-neutral-400">
                {planName} · <span className="text-amber-300">{appId}</span>
              </p>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-6 py-2.5 text-sm text-amber-100 hover:bg-amber-500/10"
              >
                {t("returnPortal")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ─────────────────────── 3D Vault Section ─────────────────────── */

function Vault3D({
  app,
  lang,
  t,
  onChoose,
}: {
  app: AppContext;
  lang: Lang;
  t: (k: keyof typeof T) => string;
  onChoose: (p: PlanTier) => void;
}) {
  const tokens = 12480;
  const cap = 20000;
  const usagePct = Math.round((tokens / cap) * 100);
  const savingsPct = 68;
  const securityPct = 99;

  // deterministic sparkline points
  const pts = Array.from({ length: 24 }, (_, i) => {
    const seed = Math.sin((i + 1) * (app.id.length + 3)) * 10000;
    const v = Math.abs(seed - Math.floor(seed));
    return 40 - v * 30 - (i % 4) * 1.2;
  });
  const path = pts
    .map((y, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * 300} ${y + 10}`)
    .join(" ");
  const area = `${path} L 300 60 L 0 60 Z`;

  return (
    <section className="mt-12">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.28em] text-amber-300/70">
          {t("vaultTitle")}
        </div>
        <h3 className="mt-1 text-2xl font-bold text-white">{t("vaultSub")}</h3>
      </div>

      <div className="grid gap-6 lg:grid-cols-10">
        {/* Left 70% — Vault + Card + Spend Chart */}
        <div className="lg:col-span-7">
          <div
            className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-black/80 via-neutral-950/90 to-black shadow-[0_0_60px_-10px_rgba(212,175,55,0.35)] backdrop-blur-2xl"
            style={{ perspective: "1200px" }}
          >
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-500/20 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-[130px]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />
            <div className="relative grid gap-6 p-6 md:grid-cols-2 md:p-8">
              {/* Neon Card */}
              <div
                className="group relative aspect-[1.6/1] rounded-2xl border border-amber-300/40 bg-gradient-to-br from-[#1a1305] via-[#0a0a12] to-[#080a18] p-5 shadow-[0_25px_50px_-15px_rgba(212,175,55,0.55),0_0_0_1px_rgba(255,215,120,0.08)_inset] transition-transform duration-500"
                style={{ transform: "rotateX(6deg) rotateY(-8deg)" }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/10 via-transparent to-cyan-400/10" />
                <div className="pointer-events-none absolute inset-x-4 top-4 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">
                      HN · Vault Card
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-500">{app.name[lang]}</div>
                  </div>
                  <div className="flex h-8 w-10 items-center justify-center rounded-md bg-gradient-to-br from-amber-300/70 to-yellow-600/40 shadow-inner">
                    <div className="h-4 w-6 rounded-sm border border-amber-500/40 bg-black/40" />
                  </div>
                </div>
                <div className="relative mt-6 font-mono text-lg tracking-[0.3em] text-amber-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]">
                  •••• •••• •••• 8181
                </div>
                <div className="relative mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">
                      {t("tokenBalance")}
                    </div>
                    <div className="mt-0.5 bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 bg-clip-text font-mono text-2xl font-black text-transparent">
                      {tokens.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ◈
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">
                      HOLDER
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-amber-200">H. MOULAY</div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute -inset-x-1/2 top-1/3 h-24 -rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md animate-[shimmer_5s_linear_infinite]"
                    style={{ backgroundSize: "200% 100%" }} />
                </div>
              </div>

              {/* Spend Chart */}
              <div className="relative rounded-2xl border border-amber-500/15 bg-black/60 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                    {t("spendFlow")}
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                    +{savingsPct}% saved
                  </span>
                </div>
                <svg viewBox="0 0 300 70" className="mt-3 h-32 w-full">
                  <defs>
                    <linearGradient id="spendFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(251,191,36)" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="rgb(251,191,36)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="spendLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#spendFill)" />
                  <path d={path} fill="none" stroke="url(#spendLine)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.7))" }} />
                </svg>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <Metric label="MRR" value={`$${(app.mrr / 1000).toFixed(1)}k`} />
                  <Metric label="Tx/day" value="428" />
                  <Metric label="Avg $" value="$42" />
                </div>
              </div>
            </div>

            {/* Bottom dials */}
            <div className="relative grid gap-4 border-t border-amber-500/10 bg-black/50 p-6 sm:grid-cols-3">
              <Dial label={t("dialUsage")} value={usagePct} color="#f59e0b" />
              <Dial label={t("dialSavings")} value={savingsPct} color="#34d399" />
              <Dial label={t("dialSecurity")} value={securityPct} color="#22d3ee" />
            </div>
          </div>
        </div>

        {/* Right 30% — Action rectangles */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <VaultAction
            title={t("buyTokens")}
            hint="1,000 ◈ · $19"
            icon={<Sparkles className="h-5 w-5" />}
            onClick={() => onChoose("basic")}
          />
          <VaultAction
            title={t("renewPlan")}
            hint={`${PLAN_NAMES.pro[lang]} · $${PLAN_PRICES.pro}`}
            icon={<Crown className="h-5 w-5" />}
            featured
            onClick={() => onChoose("pro")}
          />
          <VaultAction
            title={t("cryptoSync")}
            hint="BTC · ETH · USDT · SOL"
            icon={<Wallet className="h-5 w-5" />}
            onClick={() => onChoose("enterprise")}
          />
          <div className="mt-auto rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.05] p-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              {t("liveEncrypt")}
            </div>
            <div className="mt-1 font-mono text-[10px] text-emerald-200/70">
              AES-256-GCM · TLS 1.3
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vaultSweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes dialRot { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-500/10 bg-black/40 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</div>
      <div className="font-mono text-xs font-semibold text-amber-200">{value}</div>
    </div>
  );
}

function Dial({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
          <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="4" fill="none"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white">
          {value}%
        </div>
        <div
          className="absolute inset-0 rounded-full border border-dashed opacity-40"
          style={{ borderColor: color, animation: "dialRot 12s linear infinite" }}
        />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
        <div className="text-sm font-semibold text-neutral-200">Live</div>
      </div>
    </div>
  );
}

function VaultAction({
  title,
  hint,
  icon,
  onClick,
  featured,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5",
        featured
          ? "border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-black to-black shadow-[0_0_35px_-8px_rgba(212,175,55,0.55)]"
          : "border-amber-500/20 bg-black/60 hover:border-amber-400/50 hover:shadow-[0_0_30px_-10px_rgba(212,175,55,0.55)]",
      ].join(" ")}
    >
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="mt-0.5 font-mono text-[11px] text-amber-200/80">{hint}</div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-amber-300/70 transition group-hover:text-amber-200" />
      </div>
      {/* Neon sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent opacity-0 blur-md group-hover:opacity-100"
          style={{ animation: "vaultSweep 1.6s ease-in-out infinite" }} />
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-2 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
    </button>
  );
}