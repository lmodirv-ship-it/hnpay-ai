import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, Check, CreditCard, Repeat, Receipt, Globe2, ShieldCheck, Code2,
  Webhook, BarChart3, Languages, Wallet, Zap,
} from "lucide-react";

type Lang = "ar" | "en" | "fr";

const COPY = {
  ar: {
    nav: { product: "المنتج", pricing: "الأسعار", developers: "المطورون", signin: "تسجيل الدخول", start: "ابدأ الآن" },
    badge: "منصة دفع واشتراكات لأي موقع",
    title: "استقبل المدفوعات وأدر الاشتراكات من مكان واحد",
    sub: "HN-PAY بنية دفع متكاملة لأي موقع أو تطبيق: صفحات دفع جاهزة، فوترة متكررة، فواتير تلقائية، ولوحة تحكم واحدة لكل مشاريعك.",
    cta: "أنشئ حسابًا مجانيًا", cta2: "اطّلع على التوثيق",
    trust: ["بدون رسوم إعداد", "عملات متعددة", "ربط خلال دقائق"],
    featTitle: "كل ما تحتاجه لتحصيل أموالك",
    feats: [
      ["صفحة دفع جاهزة", "نافذة دفع آمنة بهوية موقعك، تعمل على الجوال والحاسوب."],
      ["اشتراكات متكررة", "خطط شهرية وسنوية، فترات تجريبية، ترقية وتخفيض تلقائي."],
      ["فواتير تلقائية", "إصدار الفواتير والإيصالات وإرسالها للعملاء فور الدفع."],
      ["متعدد المواقع", "أدر مدفوعات عدة مواقع ومشاريع من حساب واحد."],
      ["أمان وحماية", "تشفير كامل، صلاحيات دقيقة، وسجل تدقيق لكل عملية."],
      ["تقارير لحظية", "الإيراد الشهري، الاشتراكات النشطة، ومعدل الإلغاء."],
    ],
    devTitle: "اربط موقعك بسطرين من الكود",
    devSub: "واجهة برمجية بسيطة وإشعارات فورية (Webhooks) تعمل مع أي لغة أو منصة.",
    devPoints: ["مفاتيح API لكل موقع", "إشعارات فورية موقّعة", "بيئة تجريبية ومباشرة"],
    pricingTitle: "أسعار واضحة", pricingSub: "ادفع فقط عندما تربح.",
    plans: [
      ["البداية", "0", "حتى 3 مواقع", ["صفحة دفع", "اشتراكات", "فواتير"]],
      ["النمو", "29", "مواقع غير محدودة", ["كل ما سبق", "تقارير متقدمة", "نطاق مخصص"]],
      ["المؤسسات", "—", "حسب الطلب", ["دعم مخصص", "اتفاقية خدمة", "تكاملات خاصة"]],
    ],
    perMonth: "/ شهريًا", choose: "اختر الخطة", popular: "الأكثر اختيارًا",
    finalTitle: "جاهز لبدء التحصيل؟", finalSub: "أنشئ حسابك واربط أول موقع اليوم.",
    footer: "جميع الحقوق محفوظة.", privacy: "الخصوصية", terms: "الشروط",
  },
  en: {
    nav: { product: "Product", pricing: "Pricing", developers: "Developers", signin: "Sign in", start: "Get started" },
    badge: "Payments & subscriptions for any website",
    title: "Accept payments and manage subscriptions in one place",
    sub: "HN-PAY is complete payment infrastructure for any site or app: hosted checkout, recurring billing, automatic invoices and one dashboard for all your projects.",
    cta: "Create free account", cta2: "Read the docs",
    trust: ["No setup fees", "Multi-currency", "Live in minutes"],
    featTitle: "Everything you need to get paid",
    feats: [
      ["Hosted checkout", "A secure, branded payment window that works on mobile and desktop."],
      ["Recurring billing", "Monthly and yearly plans, trials, automatic upgrades and downgrades."],
      ["Automatic invoices", "Invoices and receipts issued and emailed the moment a payment lands."],
      ["Multi-site", "Manage payments for many sites and projects from one account."],
      ["Security built in", "Full encryption, fine-grained permissions and an audit trail."],
      ["Real-time reports", "MRR, active subscriptions and churn at a glance."],
    ],
    devTitle: "Connect your site with two lines of code",
    devSub: "A simple API and instant webhooks that work with any language or platform.",
    devPoints: ["API keys per site", "Signed real-time webhooks", "Test and live modes"],
    pricingTitle: "Simple pricing", pricingSub: "Pay only when you earn.",
    plans: [
      ["Starter", "0", "Up to 3 sites", ["Checkout", "Subscriptions", "Invoices"]],
      ["Growth", "29", "Unlimited sites", ["Everything in Starter", "Advanced reports", "Custom domain"]],
      ["Enterprise", "—", "Custom", ["Dedicated support", "SLA", "Custom integrations"]],
    ],
    perMonth: "/ month", choose: "Choose plan", popular: "Most popular",
    finalTitle: "Ready to start getting paid?", finalSub: "Create your account and connect your first site today.",
    footer: "All rights reserved.", privacy: "Privacy", terms: "Terms",
  },
  fr: {
    nav: { product: "Produit", pricing: "Tarifs", developers: "Développeurs", signin: "Connexion", start: "Commencer" },
    badge: "Paiements et abonnements pour tout site",
    title: "Encaissez et gérez vos abonnements au même endroit",
    sub: "HN-PAY est une infrastructure de paiement complète : page de paiement hébergée, facturation récurrente, factures automatiques et un tableau de bord unique.",
    cta: "Créer un compte gratuit", cta2: "Voir la documentation",
    trust: ["Sans frais d'installation", "Multi-devises", "En ligne en quelques minutes"],
    featTitle: "Tout pour être payé",
    feats: [
      ["Paiement hébergé", "Une fenêtre de paiement sécurisée à vos couleurs, mobile et desktop."],
      ["Facturation récurrente", "Plans mensuels et annuels, essais, changements de plan automatiques."],
      ["Factures automatiques", "Factures et reçus envoyés dès la réception du paiement."],
      ["Multi-sites", "Gérez plusieurs sites et projets depuis un seul compte."],
      ["Sécurité intégrée", "Chiffrement, permissions fines et journal d'audit."],
      ["Rapports en temps réel", "MRR, abonnements actifs et attrition en un coup d'œil."],
    ],
    devTitle: "Connectez votre site en deux lignes",
    devSub: "Une API simple et des webhooks instantanés, pour tout langage ou plateforme.",
    devPoints: ["Clés API par site", "Webhooks signés", "Modes test et live"],
    pricingTitle: "Des tarifs simples", pricingSub: "Payez seulement quand vous gagnez.",
    plans: [
      ["Starter", "0", "Jusqu'à 3 sites", ["Paiement", "Abonnements", "Factures"]],
      ["Croissance", "29", "Sites illimités", ["Tout Starter", "Rapports avancés", "Domaine perso"]],
      ["Entreprise", "—", "Sur mesure", ["Support dédié", "SLA", "Intégrations sur mesure"]],
    ],
    perMonth: "/ mois", choose: "Choisir", popular: "Le plus choisi",
    finalTitle: "Prêt à encaisser ?", finalSub: "Créez votre compte et connectez votre premier site aujourd'hui.",
    footer: "Tous droits réservés.", privacy: "Confidentialité", terms: "Conditions",
  },
} as const;

const ICONS = [CreditCard, Repeat, Receipt, Globe2, ShieldCheck, BarChart3];

export function PaymentLanding() {
  const [lang, setLang] = useState<Lang>("ar");
  useEffect(() => {
    const saved = localStorage.getItem("hnpay_lang") as Lang | null;
    if (saved && saved in COPY) setLang(saved);
  }, []);
  const change = (l: Lang) => { setLang(l); localStorage.setItem("hnpay_lang", l); };
  const c = COPY[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={lang} className="landing min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-brand-foreground"><Wallet className="h-4 w-4" /></span>
            <span className="text-lg" style={{ fontFamily: "var(--font-display)" }}>HN-PAY</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">{c.nav.product}</a>
            <a href="#developers" className="hover:text-foreground">{c.nav.developers}</a>
            <a href="#pricing" className="hover:text-foreground">{c.nav.pricing}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border p-0.5 text-xs">
              <Languages className="mx-1.5 h-3.5 w-3.5 text-muted-foreground" />
              {(["ar", "en", "fr"] as Lang[]).map((l) => (
                <button key={l} onClick={() => change(l)} aria-label={l}
                  className={`rounded-full px-2.5 py-1 font-medium uppercase ${lang === l ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
            <Link to="/auth" search={{ next: "", app: "" }} className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">{c.nav.signin}</Link>
            <Link to="/auth" search={{ next: "", app: "" }} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:opacity-90">{c.nav.start}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 start-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-brand opacity-15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-soft px-3 py-1 text-xs font-medium text-ink">
              <Zap className="h-3.5 w-3.5 text-brand" /> {c.badge}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">{c.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{c.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ next: "", app: "" }} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-brand-foreground shadow-card hover:opacity-95">
                {c.cta} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <a href="#developers" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:bg-muted">
                <Code2 className="h-4 w-4" /> {c.cta2}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {c.trust.map((t) => <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" />{t}</li>)}
            </ul>
          </div>

          {/* Checkout mock */}
          <div className="relative" dir="ltr">
            <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Acme Studio</span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-ink">Test mode</span>
              </div>
              <div className="mt-5 text-sm text-muted-foreground">Pro plan · monthly</div>
              <div className="mt-1 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>$29.00</div>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-input px-3 py-2.5 text-sm text-muted-foreground">email@example.com</div>
                <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2.5 text-sm">
                  <span className="tracking-widest">4242 4242 4242 4242</span><CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-input px-3 py-2.5 text-sm text-muted-foreground">12 / 28</div>
                  <div className="rounded-lg border border-input px-3 py-2.5 text-sm text-muted-foreground">CVC</div>
                </div>
              </div>
              <div className="mt-5 rounded-lg bg-ink py-3 text-center text-sm font-semibold text-ink-foreground">Pay $29.00</div>
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Secured by HN-PAY</div>
            </div>
            <div className="absolute -bottom-6 start-0 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-card sm:block">
              <div className="text-xs text-muted-foreground">MRR</div>
              <div className="font-bold">+ $12,480</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">{c.featTitle}</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {c.feats.map(([t, d], i) => {
              const Icon = ICONS[i];
              return (
                <div key={t} className="bg-card p-7">
                  <Icon className="h-6 w-6 text-brand" />
                  <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Developers */}
      <section id="developers" className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">{c.devTitle}</h2>
            <p className="mt-4 text-lg opacity-75">{c.devSub}</p>
            <ul className="mt-8 space-y-3">
              {c.devPoints.map((p, i) => {
                const I = [Code2, Webhook, ShieldCheck][i];
                return <li key={p} className="flex items-center gap-3"><I className="h-5 w-5 text-brand" />{p}</li>;
              })}
            </ul>
          </div>
          <pre dir="ltr" className="overflow-x-auto rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-6 text-sm leading-relaxed"><code>{`const res = await fetch("https://hnpay.live/api/public/v1/checkout-sessions", {
  method: "POST",
  headers: { Authorization: "Bearer sk_live_…" },
  body: JSON.stringify({ plan: "pro", email }),
});
const { url } = await res.json();
window.location.href = url; // → HN-PAY checkout`}</code></pre>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{c.pricingTitle}</h2>
            <p className="mt-3 text-muted-foreground">{c.pricingSub}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {c.plans.map(([name, price, note, items], i) => (
              <div key={name} className={`relative rounded-2xl border p-7 ${i === 1 ? "border-brand shadow-card" : "border-border"}`}>
                {i === 1 && <span className="absolute -top-3 start-6 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-brand-foreground">{c.popular}</span>}
                <h3 className="text-lg font-semibold">{name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{price === "—" ? price : `$${price}`}</span>
                  {price !== "—" && <span className="text-sm text-muted-foreground">{c.perMonth}</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{note}</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {items.map((it) => <li key={it} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" />{it}</li>)}
                </ul>
                <Link to="/auth" search={{ next: "", app: "" }} className={`mt-8 block rounded-full py-2.5 text-center text-sm font-semibold ${i === 1 ? "bg-brand text-brand-foreground" : "border border-border hover:bg-muted"}`}>{c.choose}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-brand px-8 py-14 text-center text-brand-foreground">
          <h2 className="text-3xl font-bold sm:text-4xl">{c.finalTitle}</h2>
          <p className="mt-3 opacity-90">{c.finalSub}</p>
          <Link to="/auth" search={{ next: "", app: "" }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-ink-foreground">
            {c.cta} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} HN-PAY. {c.footer}</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground">{c.privacy}</Link>
            <Link to="/terms" className="hover:text-foreground">{c.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
