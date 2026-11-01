import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listRoutingRules, upsertRoutingRule, deleteRoutingRule } from "@/lib/hn-pay/google-ecosystem.functions";
import { routePayment, type RoutingRule } from "@/lib/hn-pay/routing-engine";
import { Card, Badge } from "@/components/admin/AdminShell";

const PROVIDERS = ["youcan_pay", "cmi", "manual", "paypal", "google_pay", "stripe", "lemon_squeezy", "paddle", "wallet"];

export function RoutingMatrix() {
  const list = useServerFn(listRoutingRules);
  const upsert = useServerFn(upsertRoutingRule);
  const del = useServerFn(deleteRoutingRule);
  const [rules, setRules] = useState<(RoutingRule & { id: string })[]>([]);
  const [sim, setSim] = useState({ country: "MA", currency: "MAD", appCategory: "" });
  const refresh = () => list().then((r) => setRules(r as never)).catch(() => setRules([]));
  useEffect(() => { void refresh(); }, []);
  const decision = routePayment(sim, rules);

  const add = async () => {
    await upsert({ data: { priority: (rules.at(-1)?.priority ?? 0) + 10, name: "New rule", condition_country: null, condition_currency: null, condition_app_category: null, primary_provider: "paypal", fallback_provider: null, is_active: true } });
    void refresh();
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">مصفوفة التوجيه الذكي (S-Pay)</div>
          <div className="text-[11px] text-neutral-500">تُطبَّق القواعد حسب الأولوية · الارتداد الأخير دائمًا PayPal</div>
        </div>
        <button onClick={add} className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">+ قاعدة</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-neutral-500"><tr><th className="p-1">#</th><th className="p-1">الدولة</th><th className="p-1">العملة</th><th className="p-1">الفئة</th><th className="p-1">الأساسي</th><th className="p-1">الاحتياطي</th><th className="p-1">نشط</th><th /></tr></thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                {(["priority", "condition_country", "condition_currency", "condition_app_category"] as const).map((k) => (
                  <td key={k} className="p-1">
                    <input defaultValue={String(r[k] ?? "")} className="w-20 rounded border border-white/10 bg-black/40 px-1 py-0.5"
                      onBlur={async (e) => { const v = e.target.value.trim(); await upsert({ data: { ...r, [k]: k === "priority" ? Number(v) || 0 : v || null } }); void refresh(); }} />
                  </td>
                ))}
                {(["primary_provider", "fallback_provider"] as const).map((k) => (
                  <td key={k} className="p-1">
                    <select value={r[k] ?? ""} className="rounded border border-white/10 bg-black/40 px-1 py-0.5"
                      onChange={async (e) => { await upsert({ data: { ...r, [k]: e.target.value || null } as never }); void refresh(); }}>
                      {k === "fallback_provider" && <option value="">—</option>}
                      {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                ))}
                <td className="p-1 text-center"><input type="checkbox" checked={r.is_active} onChange={async (e) => { await upsert({ data: { ...r, is_active: e.target.checked } }); void refresh(); }} /></td>
                <td className="p-1"><button onClick={async () => { await del({ data: { id: r.id } }); void refresh(); }} className="text-rose-300">حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px]">
        <div className="mb-2 font-semibold">محاكاة</div>
        <div className="flex flex-wrap gap-2">
          <input value={sim.country} onChange={(e) => setSim({ ...sim, country: e.target.value.toUpperCase() })} placeholder="Country" className="w-20 rounded border border-white/10 bg-black/40 px-1 py-0.5" />
          <input value={sim.currency} onChange={(e) => setSim({ ...sim, currency: e.target.value.toUpperCase() })} placeholder="Currency" className="w-20 rounded border border-white/10 bg-black/40 px-1 py-0.5" />
          <input value={sim.appCategory} onChange={(e) => setSim({ ...sim, appCategory: e.target.value })} placeholder="SaaS_AI" className="w-24 rounded border border-white/10 bg-black/40 px-1 py-0.5" />
        </div>
        <div className="mt-2">→ <Badge tone="green">{decision.primary}</Badge> {decision.fallbacks.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)} <span className="text-neutral-500">{decision.ruleName ?? ""}</span></div>
      </div>
    </Card>
  );
}
