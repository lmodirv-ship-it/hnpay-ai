import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CreditCard, Wallet, ShieldCheck, Zap, RefreshCcw, Globe2, Check, Code2, Smartphone, Landmark } from "lucide-react";
import { routePayment, DEFAULT_RULES } from "@/lib/hn-pay/routing-engine";
import { formatPrice, useFxPrefs, type Lang } from "./fx-prefs";

const C = {
  ar: {
    badge: "متصل بمنظومة Google Cloud & AdSense (pub-3443455318197857) · PCI-DSS Level 1",
    h1: "المنصة العالمية للدفعات والاشتراكات الموحدة عبر الإنترنت",
    sub: "اقبل المدفوعات فوراً من المغرب وأوروبا والعالم عبر البطاقات البنكية الدولية، PayPal، YouCan Pay، CMI، Apple/Google Pay، ومحفظة HN-Pay الموحدة — مع إدارة ذكية للاشتراكات وإعفاء تلقائي من إعلانات Google للمشتركين.",
    cta1: "ابدأ قبول المدفوعات الآن", cta2: "استكشف تجربة الدفع الحية",
    sim: "محاكي الدفع الحي", method: "وسيلة الدفع", routed: "التوجيه الذكي اختار", fallback: "احتياطي", pay: "ادفع",
    rails: "شبكات وبوابات الدفع المدعومة",
    orchT: "محرك التوجيه الذكي للمدفوعات", orchS: "كل عملية تُوجَّه في أجزاء من الثانية إلى البوابة الأعلى قبولاً والأقل تكلفة.",
    o1: "المغرب (MAD)", o2: "أوروبا وأمريكا (EUR / USD / GBP)", o3: "حماية ضد فشل الدفع (Auto-Failover)", o3d: "تحويل فوري إلى PayPal عند تعذر أي بطاقة لضمان عدم ضياع أي مبيعة.",
    walletT: "محفظة موحدة وجواز نواة", walletS: "حساب واحد ومحفظة واحدة بـ 4 عملات (EUR / USD / MAD / GBP) تفتح لك جميع مواقع وتطبيقات ونماذج الذكاء الاصطناعي التابعة لمجموعة Groupe-HN وتزيل الإعلانات تلقائياً.",
    month: "/ شهرياً", choose: "اختر الباقة", popular: "الأكثر طلباً",
    devT: "ربط المطورين بسطر واحد", devS: "أضف السطر إلى موقعك: يفتح الدفع، يتحقق من حالة الاشتراك، ويوقف إعلانات AdSense تلقائياً للمشتركين المدفوعين.",
    d1: "دفع مستضاف وآمن", d2: "تحقق فوري من الاشتراك", d3: "إخفاء الإعلانات للمشتركين", docs: "اقرأ التوثيق",
  },
  fr: {
    badge: "Connecté à Google Cloud & AdSense (pub-3443455318197857) · PCI-DSS Level 1",
    h1: "La plateforme mondiale des paiements et abonnements unifiés en ligne",
    sub: "Acceptez les paiements du Maroc, d'Europe et du monde : cartes internationales, PayPal, YouCan Pay, CMI, Apple/Google Pay et le portefeuille HN-Pay — avec gestion intelligente des abonnements et suppression automatique des pubs Google pour les abonnés.",
    cta1: "Commencer à encaisser", cta2: "Tester le paiement en direct",
    sim: "Simulateur de paiement", method: "Moyen de paiement", routed: "Le routage intelligent a choisi", fallback: "Secours", pay: "Payer",
    rails: "Réseaux et passerelles pris en charge",
    orchT: "Orchestration intelligente des paiements", orchS: "Chaque transaction est routée en quelques millisecondes vers la passerelle la plus performante.",
    o1: "Maroc (MAD)", o2: "Europe & Amériques (EUR / USD / GBP)", o3: "Protection anti-échec (Auto-Failover)", o3d: "Bascule instantanée vers PayPal si une carte échoue — aucune vente perdue.",
    walletT: "Portefeuille unifié & NAWAT Pass", walletS: "Un compte, un portefeuille en 4 devises (EUR / USD / MAD / GBP) qui ouvre tous les sites, apps et modèles IA de Groupe-HN et retire les publicités.",
    month: "/ mois", choose: "Choisir", popular: "Populaire",
    devT: "Intégration en une ligne", devS: "Ajoutez une ligne : paiement, vérification d'abonnement et suppression automatique d'AdSense pour les abonnés payants.",
    d1: "Paiement hébergé sécurisé", d2: "Vérification d'abonnement instantanée", d3: "Pubs masquées pour les abonnés", docs: "Documentation",
  },
  en: {
    badge: "Connected to Google Cloud & AdSense (pub-3443455318197857) · PCI-DSS Level 1",
    h1: "The global platform for unified online payments and subscriptions",
    sub: "Accept payments instantly from Morocco, Europe and the world via international cards, PayPal, YouCan Pay, CMI, Apple/Google Pay and the unified HN-Pay Wallet — with smart subscription management and automatic Google ad removal for subscribers.",
    cta1: "Start accepting payments", cta2: "Explore the live checkout",
    sim: "Live checkout simulator", method: "Payment method", routed: "Smart routing selected", fallback: "Fallback", pay: "Pay",
    rails: "Supported payment rails",
    orchT: "Smart payment orchestration", orchS: "Every transaction is routed in milliseconds to the highest-converting, lowest-cost gateway.",
    o1: "Morocco (MAD)", o2: "Europe & Americas (EUR / USD / GBP)", o3: "Auto-Failover protection", o3d: "Instant switch to PayPal when a card fails — no sale is ever lost.",
    walletT: "Unified Wallet & NAWAT Pass", walletS: "One account, one wallet in 4 currencies (EUR / USD / MAD / GBP) unlocking every Groupe-HN site, app and AI model — ads removed automatically.",
    month: "/ month", choose: "Choose plan", popular: "Most popular",
    devT: "1-line SDK integration", devS: "Add one line: open checkout, verify subscription status and automatically hide AdSense for paying subscribers.",
    d1: "Secure hosted checkout", d2: "Instant subscription check", d3: "Ads hidden for subscribers", docs: "Read the docs",
  },
} satisfies Record<Lang, Record<string, string>>;

const METHODS = [
  { id: "card", label: "Visa / Mastercard", icon: CreditCard },
  { id: "paypal", label: "PayPal", icon: Wallet },
  { id: "cmi", label: "CMI Maroc", icon: Landmark },
  { id: "youcan_pay", label: "YouCan Pay", icon: CreditCard },
  { id: "google_pay", label: "Google Pay", icon: Smartphone },
  { id: "wallet", label: "HN-Pay Wallet", icon: ShieldCheck },
] as const;

const NAMES: Record<string, string> = { youcan_pay: "YouCan Pay", cmi: "CMI 3D Secure", paypal: "PayPal", stripe: "Stripe", lemon_squeezy: "Lemon Squeezy", manual: "Bank transfer", google_pay: "Google Pay", wallet: "HN-Pay Wallet" };

const RAILS = ["Visa", "Mastercard", "PayPal Commercial", "CMI Morocco (3D Secure)", "YouCan Pay", "Stripe Connect", "Lemon Squeezy (MoR)", "Google Pay", "HN-Pay Sovereign Wallet"];

const PLANS = [
  { id: "pro", eur: 9, name: { ar: "باقة الأفراد والمطورين", fr: "Pro Pass", en: "Pro Pass" }, f: { ar: ["محفظة بـ 4 عملات", "بدون إعلانات", "دعم عبر البريد"], fr: ["Portefeuille 4 devises", "Sans publicité", "Support e-mail"], en: ["4-currency wallet", "Ad-free", "Email support"] } },
  { id: "biz", eur: 49, name: { ar: "باقة الأعمال والشركات", fr: "Business Hub", en: "Business Hub" }, f: { ar: ["دفع لمواقعك غير محدود", "توجيه ذكي وفواتير", "دعم أولوية"], fr: ["Encaissement illimité", "Routage & factures", "Support prioritaire"], en: ["Unlimited checkout", "Smart routing & invoices", "Priority support"] } },
  { id: "nawat", eur: 99, name: { ar: "جواز نواة الشامل", fr: "NAWAT Pass", en: "NAWAT Pass" }, f: { ar: ["+50 موقعاً ونماذج ذكاء اصطناعي", "كل المزايا المميزة", "مدير حساب مخصص"], fr: ["50+ sites & modèles IA", "Tous les avantages premium", "Gestionnaire dédié"], en: ["50+ sites & AI models", "All premium tiers", "Dedicated manager"] } },
];

export function HnPayHub() {
  const { lang, currency } = useFxPrefs();
  const t = C[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("card");
  const [simCur, setSimCur] = useState<"MAD" | "EUR" | "USD">("MAD");

  const decision = useMemo(() => {
    if (method === "paypal" || method === "cmi" || method === "youcan_pay" || method === "google_pay" || method === "wallet") {
      return { provider: method, fallbacks: method === "paypal" ? [] : ["paypal"] };
    }
    const d = routePayment({ country: simCur === "MAD" ? "MA" : "FR", currency: simCur }, DEFAULT_RULES);
    return { provider: d.primary, fallbacks: d.fallbacks };
  }, [method, simCur]);

  const simAmount = simCur === "MAD" ? "299.00 MAD" : simCur === "EUR" ? "€27.00" : "$29.00";

  return (
    <>
      {/* 1. Hero */}
      <section id="overview" className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-fx-line bg-fx-card px-3 py-1 text-[11px] text-fx-muted"><span className="h-2 w-2 rounded-full bg-fx-green" />{t.badge}</span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">{t.h1}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-fx-muted">{t.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" search={{ next: "", app: "" }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-fx px-6 py-3 font-semibold shadow-fx">{t.cta1}<Arrow className="h-4 w-4" /></Link>
            <a href="#simulator" className="inline-flex items-center gap-2 rounded-xl border border-fx-line px-6 py-3 font-semibold hover:bg-fx-text/5">{t.cta2}</a>
          </div>
        </div>

        <div id="simulator" className="glass rounded-3xl p-6 shadow-fx">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t.sim}</span>
            <div className="flex rounded-lg border border-fx-line p-0.5 font-fx-mono text-[11px]" dir="ltr">
              {(["MAD", "EUR", "USD"] as const).map((c) => <button key={c} onClick={() => setSimCur(c)} className={`rounded-md px-2 py-1 ${simCur === c ? "bg-fx-blue" : "text-fx-muted"}`}>{c}</button>)}
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between border-b border-fx-line pb-4" dir="ltr">
            <div><div className="text-xs text-fx-muted">Acme AI · Pro monthly</div><div className="font-fx-mono text-3xl font-semibold">{simAmount}</div></div>
            <ShieldCheck className="h-6 w-6 text-fx-cyan" />
          </div>
          <div className="mt-4 text-xs text-fx-muted">{t.method}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={method === m.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs transition ${method === m.id ? "border-fx-blue bg-fx-blue/15" : "border-fx-line hover:border-fx-muted"}`} dir="ltr">
                <m.icon className="h-4 w-4 shrink-0 text-fx-cyan" />{m.label}
              </button>
            ))}
          </div>
          {method === "card" && (
            <div className="mt-4 space-y-2 font-fx-mono text-sm" dir="ltr">
              <div className="rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2.5 text-fx-muted">4242 4242 4242 4242</div>
              <div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2.5 text-fx-muted">12 / 28</div><div className="rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2.5 text-fx-muted">CVC</div></div>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-fx-green/30 bg-fx-green/10 p-3 text-xs">
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-fx-green" />{t.routed}: <b className="font-fx-latin" dir="ltr">{NAMES[decision.provider] ?? decision.provider}</b></div>
            {decision.fallbacks.length > 0 && <div className="mt-1 text-fx-muted">{t.fallback}: <span dir="ltr">{decision.fallbacks.map((f) => NAMES[f] ?? f).join(" → ")}</span></div>}
          </div>
          <button className="mt-4 w-full rounded-xl bg-fx-blue py-3 font-semibold" dir="ltr">{t.pay} {simAmount}</button>
        </div>
      </section>

      {/* 2. Rails marquee */}
      <section id="payments" className="border-y border-fx-line bg-fx-bg/50 py-6">
        <div className="mb-3 text-center text-xs uppercase tracking-widest text-fx-muted">{t.rails}</div>
        <div className="overflow-hidden" dir="ltr">
          <div className="fx-marquee flex w-max gap-10 whitespace-nowrap font-fx-latin text-sm font-semibold text-fx-muted">
            {[...RAILS, ...RAILS].map((r, i) => <span key={i} className="flex items-center gap-10">{r}<span className="text-fx-line">●</span></span>)}
          </div>
        </div>
      </section>

      {/* 3. Orchestration */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <h2 className="text-3xl font-bold md:text-4xl">{t.orchT}</h2>
        <p className="mt-3 max-w-2xl text-fx-muted">{t.orchS}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Globe2, title: t.o1, to: "YouCan Pay / CMI", tone: "text-fx-cyan" },
            { icon: Globe2, title: t.o2, to: "Stripe / PayPal / Lemon Squeezy", tone: "text-fx-blue" },
            { icon: RefreshCcw, title: t.o3, to: "PayPal", tone: "text-fx-green", desc: t.o3d },
          ].map((x) => (
            <div key={x.title} className="glass rounded-2xl p-6">
              <x.icon className={`h-6 w-6 ${x.tone}`} />
              <div className="mt-4 font-semibold">{x.title}</div>
              <div className="mt-4 flex items-center gap-2 text-sm"><Arrow className="h-4 w-4 text-fx-muted" /><span className="rounded-lg border border-fx-line bg-fx-bg/60 px-2 py-1 font-fx-latin" dir="ltr">{x.to}</span></div>
              {x.desc && <p className="mt-3 text-xs text-fx-muted">{x.desc}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Wallet & plans */}
      <section id="nawat" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
          <div>
            <h2 className="text-3xl font-bold">{t.walletT}</h2>
            <p className="mt-3 text-fx-muted">{t.walletS}</p>
            <div className="mt-8 aspect-[1.6] rounded-2xl bg-gradient-fx-card p-6 shadow-fx" dir="ltr">
              <div className="flex justify-between"><span className="font-fx-latin font-bold">HN-Pay Live</span><span className="text-xs opacity-80">NAWAT PASS</span></div>
              <div className="mt-8 font-fx-mono text-lg tracking-widest">•••• •••• •••• 2026</div>
              <div className="mt-6 flex justify-between font-fx-mono text-xs opacity-90"><span>EUR · USD · MAD · GBP</span><span>Groupe-HN</span></div>
            </div>
          </div>
          <div id="pricing" className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => {
              const hot = p.id === "biz";
              return (
                <div key={p.id} className={`glass flex flex-col rounded-2xl p-6 ${hot ? "ring-2 ring-fx-blue" : ""}`}>
                  {hot && <span className="mb-3 w-fit rounded-full bg-fx-blue/20 px-2 py-0.5 text-[10px] text-fx-cyan">{t.popular}</span>}
                  <div className="font-semibold">{p.name[lang]}</div>
                  <div className="mt-4 font-fx-mono text-3xl font-semibold" dir="ltr">{formatPrice(p.eur, currency)}</div>
                  <div className="text-xs text-fx-muted">{t.month}</div>
                  <ul className="mt-6 flex-1 space-y-2 text-sm">{p.f[lang].map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-fx-green" />{f}</li>)}</ul>
                  <Link to="/auth" search={{ next: "", app: "" }} className={`mt-6 rounded-xl py-2.5 text-center text-sm font-semibold ${hot ? "bg-fx-blue" : "border border-fx-line hover:bg-fx-text/5"}`}>{t.choose}</Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SDK */}
      <section id="developers" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Code2 className="h-7 w-7 text-fx-cyan" />
            <h2 className="mt-4 text-3xl font-bold">{t.devT}</h2>
            <p className="mt-3 text-fx-muted">{t.devS}</p>
            <ul className="mt-6 space-y-2 text-sm">{[t.d1, t.d2, t.d3].map((d) => <li key={d} className="flex gap-2"><Check className="h-4 w-4 text-fx-green" />{d}</li>)}</ul>
          </div>
          <div className="glass overflow-hidden rounded-2xl" dir="ltr">
            <div className="flex gap-1.5 border-b border-fx-line px-4 py-3"><span className="h-3 w-3 rounded-full bg-fx-red/70" /><span className="h-3 w-3 rounded-full bg-fx-muted/40" /><span className="h-3 w-3 rounded-full bg-fx-green/70" /></div>
            <pre className="overflow-x-auto p-5 font-fx-mono text-[13px] leading-7"><code><span className="text-fx-muted">{"<!-- HN-Pay Live -->"}</span>{"\n"}<span className="text-fx-cyan">{"<script"}</span> src=<span className="text-fx-green">"https://www.hnpay.live/sdk.js"</span>{"\n        "}data-site-id=<span className="text-fx-green">"hn-ai-pro"</span><span className="text-fx-cyan">{"></script>"}</span>{"\n\n"}<span className="text-fx-cyan">HnPay</span>.open({"{"} plan: <span className="text-fx-green">"pro_monthly"</span> {"}"});</code></pre>
          </div>
        </div>
      </section>
    </>
  );
}
