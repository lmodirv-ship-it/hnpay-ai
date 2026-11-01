import { createFileRoute, Link } from "@tanstack/react-router";
import { GlobalShell } from "@/components/hn-pay/GlobalShell";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — HN-Pay Hub" },
      { name: "description", content: "Terms governing your use of HN-Pay Hub and the HN Ecosystem cluster." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <GlobalShell>
      <div className="mx-auto max-w-4xl px-6 py-16 text-white">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fx-blue/30 bg-fx-blue/10 shadow-[0_0_30px_color-mix(in_oklab,var(--fx-blue)_40%,transparent)]">
            <ScrollText className="h-5 w-5 text-fx-blue" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-fx-blue/70">HN-Pay · Legal</div>
            <h1 className="bg-gradient-to-r from-fx-blue via-fx-cyan to-fx-blue bg-clip-text text-3xl font-black text-transparent">
              Terms of Use / شروط الاستخدام
            </h1>
          </div>
        </div>

        <div className="space-y-10 rounded-3xl border border-fx-line bg-fx-card p-8 backdrop-blur-xl">
          <section>
            <h2 className="text-lg font-semibold text-fx-blue">1. Acceptance / القبول</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              By using HN-Pay Hub you agree to these terms and to the specific terms of each
              connected HN service you activate. If you disagree, please stop using the service.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70" dir="rtl">
              باستخدامك لـ HN-Pay Hub فإنك توافق على هذه الشروط وعلى الشروط الخاصة بكل خدمة من خدمات
              منظومة HN التي تقوم بتفعيلها. إذا لم توافق، يُرجى التوقف عن استخدام الخدمة.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-fx-blue">2. Accounts & Roles / الحسابات والأدوار</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Each account is issued a role (owner, admin, subscriber). You are responsible for
              keeping your credentials safe and for actions performed under your session.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-fx-blue">3. Billing & Tokens / الفوترة والوحدات</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Subscriptions and token bundles are prepaid. Consumption is metered per HN service
              and reflected in your invoices. Refunds follow the policy displayed at checkout.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-fx-blue">4. Acceptable Use / الاستخدام المقبول</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              You may not attempt to bypass authentication, abuse rate limits, reverse-engineer
              the FireShield layer, or use HN services to distribute unlawful content.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-fx-blue">5. Liability / المسؤولية</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              HN-Pay Hub is provided “as is”. To the extent permitted by law, HN Group's liability
              is limited to the amounts you paid in the twelve months preceding the claim.
            </p>
          </section>
          <div className="pt-4">
            <Link to="/" className="text-xs text-fx-blue hover:text-fx-blue">← Back / رجوع</Link>
          </div>
        </div>
      </div>
    </GlobalShell>
  );
}