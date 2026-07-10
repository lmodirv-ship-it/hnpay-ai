import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Download, Package, Webhook, MousePointerClick, FileSpreadsheet } from "lucide-react";
import { OwnerShell } from "@/routes/_authenticated/owner/dashboard";
import { useHnSession } from "@/lib/auth/use-session";
import { SDK_JS, USAGE_JS, EDGE_TEMPLATE, CHECKOUT_BUTTON, CSV_TEMPLATE } from "@/lib/hn-pay/sdk-snippets";

export const Route = createFileRoute("/_authenticated/owner/hn-pay/integrate")({
  ssr: false,
  head: () => ({ meta: [{ title: "Integrate · HN-Pay" }] }),
  component: IntegratePage,
});

function IntegratePage() {
  const { profile, signOut } = useHnSession();
  return (
    <OwnerShell profile={profile} signOut={signOut}>
      <div className="mb-8">
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">Developer Kit</div>
        <h1 className="text-3xl font-bold">Integrate any site with HN-Pay</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-400">
          One unified interface. Every site of the HN network — 150+ apps — uses the same SDK, the same checkout button, and the same webhook template. Different API keys per site, one operations console.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SnippetCard icon={<Package />} title="Unified SDK (hn-pay.js)" description="Drop-in browser SDK. Vanilla JS, zero dependencies." code={SDK_JS} filename="hn-pay.js" />
        <SnippetCard icon={<MousePointerClick />} title="One-click checkout button" description="Copy-paste HTML. Works on any site — no bundler needed." code={CHECKOUT_BUTTON} filename="hn-pay-button.html" />
        <SnippetCard icon={<Webhook />} title="Edge function template" description="Receives HN-Pay webhooks. Verifies HMAC signature." code={EDGE_TEMPLATE} filename="hn-pay-webhook.ts" />
        <SnippetCard icon={<FileSpreadsheet />} title="Bulk sites CSV template" description="Fill columns, then upload from Sites → Bulk import to register up to 500 sites at once." code={CSV_TEMPLATE} filename="hn-pay-sites-template.csv" />
      </div>

      <div className="mt-8 rounded-2xl border border-amber-500/20 bg-black/40 p-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300/80">Server-side usage</div>
        <Code code={USAGE_JS} />
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">Rollout strategy</div>
        <div className="mt-2 text-sm text-neutral-300">
          Start with 90 pilot sites, then 30, then the remaining batch. Each site keeps its own API key so we can disable one without impacting the rest.
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-neutral-400 md:grid-cols-3">
          <Step n="1" label="Register site → generate test key" />
          <Step n="2" label="Deploy SDK + webhook, run in test mode" />
          <Step n="3" label="Flip to live key when confirmed" />
        </div>
      </div>
    </OwnerShell>
  );
}

function Step({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-[10px] text-emerald-300">{n}</span>
      <span>{label}</span>
    </div>
  );
}

function SnippetCard({ icon, title, description, code, filename }: { icon: React.ReactNode; title: string; description: string; code: string; filename: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300">{icon}</div>
          <div>
            <div className="text-sm font-bold">{title}</div>
            <div className="mt-0.5 text-xs text-neutral-400">{description}</div>
          </div>
        </div>
        <DownloadBtn code={code} filename={filename} />
      </div>
      <Code code={code} />
    </div>
  );
}

function Code({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/60 p-3 text-[11px] leading-relaxed text-neutral-300"><code>{code}</code></pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="absolute right-2 top-2 rounded border border-white/10 bg-black/70 p-1.5 text-neutral-300 hover:bg-white/5"
        aria-label="Copy"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

function DownloadBtn({ code, filename }: { code: string; filename: string }) {
  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={download} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-neutral-300 hover:bg-white/5">
      <Download className="h-3 w-3" /> {filename}
    </button>
  );
}
