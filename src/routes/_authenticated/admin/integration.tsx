import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Card } from "@/components/admin/AdminShell";
import { ArrowLeft, Code2, KeyRound, Webhook } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/integration")({
  head: () => ({ meta: [{ title: "التكامل و API · HN-PAY" }] }),
  component: IntegrationPage,
});

function IntegrationPage() {
  return (
    <AdminShell title="التكامل و API" subtitle="اربط جميع مواقع مجموعة HN بنفس بوابة الدفع.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <IntCard icon={<KeyRound className="h-5 w-5" />} title="مفاتيح API" desc="إنشاء وإدارة مفاتيح لكل موقع مسجّل." to="/owner/sites" />
        <IntCard icon={<Webhook className="h-5 w-5" />} title="Webhooks" desc="إعداد نقاط استقبال أحداث الدفع." to="/owner/hn-pay/integrate" />
        <IntCard icon={<Code2 className="h-5 w-5" />} title="مقتطفات SDK" desc="زرّ دفع جاهز + قالب استقبال." to="/owner/hn-pay/integrate" />
      </div>
      <Card className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">نقطة نهاية الـ Checkout</h3>
        <pre dir="ltr" className="overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-4 font-mono text-xs text-emerald-200">
{`POST /api/public/v1/checkout-sessions
Authorization: Bearer <SITE_API_KEY>
Content-Type: application/json

{
  "plan_id": "…",
  "customer": { "email": "user@example.com", "name": "User" },
  "success_url": "https://example.com/thanks",
  "cancel_url":  "https://example.com/cancel"
}`}
        </pre>
      </Card>
    </AdminShell>
  );
}

function IntCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc: string; to: string }) {
  return (
    <Link to={to as any} className="group">
      <Card className="transition hover:border-amber-400/40 hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.5)]">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300">{icon}</div>
        <div className="text-sm font-bold">{title}</div>
        <div className="mt-1 text-xs text-neutral-400">{desc}</div>
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-300">
          <ArrowLeft className="h-3 w-3" /> فتح
        </div>
      </Card>
    </Link>
  );
}
