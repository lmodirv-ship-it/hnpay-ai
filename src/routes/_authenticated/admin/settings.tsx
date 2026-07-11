import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell, Card } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "إعدادات الموقع · HN-PAY" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [brand, setBrand] = useState("HN-PAY");
  const [currency, setCurrency] = useState("MAD");
  const [locale, setLocale] = useState("ar-MA");
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      localStorage.setItem("hn_pay_settings", JSON.stringify({ brand, currency, locale }));
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <AdminShell title="إعدادات الموقع" subtitle="اسم العلامة التجارية، العملة الافتراضية، واللغة.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold">العلامة التجارية</h3>
          <label className="block text-xs text-neutral-400">اسم العلامة</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold">التفضيلات</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400">العملة</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <option>MAD</option><option>USD</option><option>EUR</option><option>SAR</option><option>AED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400">اللغة</label>
              <select value={locale} onChange={(e) => setLocale(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <option value="ar-MA">العربية</option><option value="fr-FR">Français</option><option value="en-US">English</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 hover:bg-amber-500/20">حفظ الإعدادات</button>
        {saved && <span className="text-xs text-emerald-300">تم الحفظ.</span>}
      </div>
      <p className="mt-4 text-[11px] text-neutral-500">الإعدادات الحالية محفوظة محليًا. لاحقًا يمكن نقلها إلى جدول <code>site_settings</code>.</p>
    </AdminShell>
  );
}
