import { createFileRoute, Link } from "@tanstack/react-router";
import { GlobalShell } from "@/components/hn-pay/GlobalShell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — HN-Pay Hub" },
      { name: "description", content: "How HN-Pay Hub collects, uses, and protects your data across the HN Ecosystem." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <GlobalShell>
      <div className="mx-auto max-w-4xl px-6 py-16 text-white">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 shadow-[0_0_30px_rgba(251,191,36,0.35)]">
            <ShieldCheck className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-amber-300/70">HN-Pay · Legal</div>
            <h1 className="bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 bg-clip-text text-3xl font-black text-transparent">
              Privacy Policy / سياسة الخصوصية
            </h1>
          </div>
        </div>

        <div className="space-y-10 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">
          <section>
            <h2 className="text-lg font-semibold text-amber-200">1. Overview</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              HN-Pay Hub is the centralized billing and identity gateway for the HN Ecosystem.
              We only collect the data required to authenticate you, process payments, and route
              you across connected HN services. This page is maintained by the HN Group and describes
              our current practices; it is not an independent certification.
            </p>
          </section>
          <section dir="rtl">
            <h2 className="text-lg font-semibold text-amber-200">١. نظرة عامة</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              HN-Pay Hub هو البوابة المركزية للفوترة والهوية داخل منظومة HN. نجمع فقط البيانات
              الضرورية للمصادقة، معالجة المدفوعات، وتوجيهك بين الخدمات المرتبطة. تُدار هذه الصفحة
              من طرف مجموعة HN وتصف ممارساتنا الحالية دون أن تشكّل شهادة مستقلة.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-amber-200">2. Data We Collect / البيانات التي نجمعها</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
              <li>Account: email, display name, connected HN app identifiers.</li>
              <li>Billing: plan, invoices, tokens usage — never full card numbers.</li>
              <li>Session: signed authentication token used for Single Sign-On.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-amber-200">3. Security / الأمان</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Transport is protected with TLS 1.3. Sensitive fields are encrypted at rest
              (AES-256-GCM). Access to billing data is scoped by role (owner / admin / subscriber)
              and enforced with row-level policies in the database.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-amber-200">4. Your Rights / حقوقك</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              You may request export or deletion of your account and billing history at any time
              by contacting the workspace owner from the Owner Console.
            </p>
          </section>
          <div className="pt-4">
            <Link to="/" className="text-xs text-amber-300 hover:text-amber-200">← Back / رجوع</Link>
          </div>
        </div>
      </div>
    </GlobalShell>
  );
}