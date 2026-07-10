import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/**
 * DEMO — simulates a merchant site (e.g. hnchat.net) using the HN-Pay
 * embedded checkout. Full round trip:
 *
 *   1) User clicks "Buy Pro"
 *   2) Demo backend calls POST /api/public/v1/checkout-sessions
 *      (you paste an sk_test_ key from Owner → Sites → API Keys)
 *   3) HnPay.open({ embed_url }) shows the iframe
 *   4) User clicks "Pay with HN-Pay Sandbox" inside the iframe
 *   5) Mock provider webhook fires → settlement writes payment + subscription
 *      → outbound webhook to the site (whichever URL you configured)
 *   6) iframe reports success back via postMessage
 */
export const Route = createFileRoute("/demo/embed")({
  ssr: false,
  component: DemoEmbed,
  head: () => ({ meta: [{ title: "HN-Pay · Embed Sandbox" }] }),
});

type CreateResp = {
  checkout_id: string;
  client_token: string;
  embed_url: string;
  amount: number;
  currency: string;
  status: string;
};

function DemoEmbed() {
  const [apiKey, setApiKey] = useState("");
  const [planCode, setPlanCode] = useState("pro_monthly");
  const [email, setEmail] = useState("demo@hnchat.net");
  const [externalId, setExternalId] = useState("user_784");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [session, setSession] = useState<CreateResp | null>(null);
  const sdkLoaded = useRef(false);

  useEffect(() => {
    if (sdkLoaded.current) return;
    const s = document.createElement("script");
    s.src = "/hn-pay.js";
    s.async = true;
    document.body.appendChild(s);
    sdkLoaded.current = true;
  }, []);

  const push = (m: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 40));

  const startCheckout = async () => {
    setBusy(true);
    push("→ POST /api/public/v1/checkout-sessions");
    try {
      const res = await fetch("/api/public/v1/checkout-sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          plan_code: planCode,
          display_mode: "embedded",
          customer: { external_id: externalId, email },
        }),
      });
      const j = (await res.json()) as CreateResp & { error?: { message: string } };
      if (!res.ok) {
        push(`✕ ${res.status} — ${j.error?.message ?? "error"}`);
        setBusy(false);
        return;
      }
      push(`✓ session ${j.checkout_id} · ${j.amount} ${j.currency}`);
      setSession(j);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const HnPay = (window as any).HnPay;
      if (!HnPay) {
        push("✕ hn-pay.js not loaded yet — try again");
        setBusy(false);
        return;
      }
      HnPay.open({
        embed_url: j.embed_url,
        onSuccess: (evt: { checkout_id: string }) => {
          push(`✓ SUCCESS event received · ${evt.checkout_id}`);
        },
        onFailed: () => push("✕ payment failed"),
        onClose: () => push("· checkout closed"),
      });
    } catch (err) {
      push(`✕ ${String(err)}`);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-black text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
          Merchant demo
        </div>
        <h1 className="text-3xl font-black">hnchat.net · Pricing</h1>
        <p className="mt-2 max-w-lg text-sm text-neutral-400">
          This page simulates one of your 149 sites. Paste a test API key from{" "}
          <span className="text-neutral-200">Owner → Sites</span>, then click{" "}
          <span className="text-amber-300">Buy Pro</span>.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-widest text-neutral-500">Configuration</div>
            <label className="mt-4 block text-[11px] font-semibold text-neutral-400">
              Site API key (sk_test_… or sk_live_…)
            </label>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_test_..."
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-neutral-100 outline-none focus:border-amber-400/40"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400">plan_code</label>
                <input
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-neutral-100 outline-none focus:border-amber-400/40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400">customer id</label>
                <input
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-neutral-100 outline-none focus:border-amber-400/40"
                />
              </div>
            </div>
            <label className="mt-3 block text-[11px] font-semibold text-neutral-400">email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-amber-400/40"
            />
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-black to-black p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">Pro plan</div>
            <div className="mt-3 flex items-baseline gap-1">
              <div className="text-4xl font-black text-white">99</div>
              <div className="text-sm font-semibold text-neutral-300">MAD / month</div>
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-neutral-300">
              <li>· Unlimited chats</li>
              <li>· Priority routing across HN network</li>
              <li>· Access to premium AI models</li>
            </ul>
            <button
              disabled={busy || !apiKey.trim()}
              onClick={startCheckout}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-4 py-3 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-amber-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Opening…" : "Buy Pro"}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            Event log
          </div>
          <div className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/60 p-3 font-mono text-[11px] text-neutral-300">
            {log.length === 0 ? (
              <div className="text-neutral-600">— idle —</div>
            ) : (
              log.map((l, i) => <div key={i}>{l}</div>)
            )}
          </div>
          {session && (
            <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[11px] text-neutral-400">
              <span className="text-neutral-500">last session · </span>
              <span className="font-mono text-neutral-200">{session.checkout_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
