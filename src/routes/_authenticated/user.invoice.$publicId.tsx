import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyInvoice } from "@/lib/hn-pay/subscription-manage.functions";
import { Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/user/invoice/$publicId")({
  head: () => ({ meta: [{ title: "Invoice · HN-Pay Live" }, { name: "robots", content: "noindex" }] }),
  component: InvoicePage,
});

type Inv = Awaited<ReturnType<typeof getMyInvoice>>;

function InvoicePage() {
  const { publicId } = Route.useParams();
  const load = useServerFn(getMyInvoice);
  const [inv, setInv] = useState<Inv | undefined>(undefined);
  useEffect(() => { load({ data: { publicId } }).then(setInv).catch(() => setInv(null)); }, [publicId]);

  if (inv === undefined) return <div className="p-10 text-center text-sm">Loading…</div>;
  if (!inv) return <div className="p-10 text-center text-sm">Invoice not found. <Link to="/user/dashboard" className="underline">Back</Link></div>;

  const site = inv.sites as { name?: string; domain?: string } | null;
  const plan = inv.plans as { name?: string; billing_interval?: string } | null;
  const cust = inv.customers as { name?: string; email?: string } | null;
  const amount = Number(inv.amount);
  const date = new Date(inv.created_at);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <style>{`@media print { .no-print { display:none !important } @page { size: A4; margin: 14mm } }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-between px-4">
        <Link to="/user/dashboard" className="inline-flex items-center gap-1 text-sm text-neutral-700"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>
      <article className="mx-auto max-w-3xl bg-white p-10 text-neutral-900 shadow-sm print:shadow-none">
        <header className="flex items-start justify-between border-b pb-6">
          <div>
            <div className="text-2xl font-bold tracking-tight">HN-Pay Live</div>
            <div className="text-xs text-neutral-500">Groupe-HN · hnpay.live</div>
          </div>
          <div className="text-end">
            <div className="text-xl font-semibold">INVOICE</div>
            <div className="font-mono text-xs text-neutral-600">{inv.public_id.toUpperCase()}</div>
            <div className="text-xs text-neutral-600">{date.toLocaleDateString()}</div>
          </div>
        </header>
        <section className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div><div className="text-[10px] uppercase tracking-widest text-neutral-500">Billed to</div><div className="mt-1 font-medium">{cust?.name ?? cust?.email}</div><div className="text-neutral-600">{cust?.email}</div></div>
          <div className="text-end"><div className="text-[10px] uppercase tracking-widest text-neutral-500">Merchant</div><div className="mt-1 font-medium">{site?.name}</div><div className="text-neutral-600">{site?.domain}</div></div>
        </section>
        <table className="w-full text-sm">
          <thead><tr className="border-y bg-neutral-50 text-start text-[11px] uppercase tracking-wider text-neutral-500"><th className="p-2 text-start">Description</th><th className="p-2 text-end">Amount</th></tr></thead>
          <tbody><tr className="border-b"><td className="p-2">{plan?.name ?? "Payment"}{plan?.billing_interval ? ` · ${plan.billing_interval}` : ""}</td><td className="p-2 text-end font-mono">{amount.toFixed(2)} {inv.currency}</td></tr></tbody>
        </table>
        <div className="mt-4 ms-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-mono">{amount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span className="font-mono">0.00</span></div>
          <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span className="font-mono">{amount.toFixed(2)} {inv.currency}</span></div>
        </div>
        <footer className="mt-10 border-t pt-4 text-[11px] text-neutral-500">
          Status: <b className="uppercase">{inv.status}</b> · Method: {inv.provider ?? "—"} {inv.provider_ref ? `· Ref ${inv.provider_ref}` : ""}
          <div className="mt-1">Thank you for your business. This invoice was generated electronically by HN-Pay Live.</div>
        </footer>
      </article>
    </div>
  );
}
