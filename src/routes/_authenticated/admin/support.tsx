import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Card } from "@/components/admin/AdminShell";
import { BookOpen, MessageSquare, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/support")({
  head: () => ({ meta: [{ title: "الدعم · HN-PAY" }] }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <AdminShell title="الدعم" subtitle="مركز مساعدة سريع لفريق التشغيل والدمج.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300"><BookOpen className="h-5 w-5" /></div>
          <div className="text-sm font-bold">التوثيق</div>
          <p className="mt-2 text-xs text-neutral-400">دليل SDK وواجهة API الرسمية للـ HN-PAY.</p>
        </Card>
        <Card>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-sky-400/40 bg-sky-500/10 text-sky-300"><MessageSquare className="h-5 w-5" /></div>
          <div className="text-sm font-bold">دردشة الفريق</div>
          <p className="mt-2 text-xs text-neutral-400">قناة داخلية للتنسيق حول المدفوعات والحوادث.</p>
        </Card>
        <Card>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-300"><Mail className="h-5 w-5" /></div>
          <div className="text-sm font-bold">تواصل مباشر</div>
          <p className="mt-2 text-xs text-neutral-400">
            <a href="mailto:info@hnchat.net" className="text-amber-300 hover:underline">info@hnchat.net</a>
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
