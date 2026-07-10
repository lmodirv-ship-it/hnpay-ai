// Copy-ready SDK snippets shown in the Owner integration page.
// Kept as plain strings so they can be rendered and downloaded.

export const SDK_JS = `// hn-pay.js — Unified checkout SDK for HN network sites
// Include in any site: <script src="https://pay.hn/sdk/hn-pay.js"></script>
(function (global) {
  function HnPay(opts) {
    if (!(this instanceof HnPay)) return new HnPay(opts);
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl || "https://pay.hn";
  }
  HnPay.prototype.checkout = {
    create: async function (payload) {
      const res = await fetch(this._base + "/api/public/v1/checkout-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + this._key,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("HN-Pay: " + (await res.text()));
      return res.json();
    },
  };
  // bind private fields
  const origCreate = HnPay.prototype.checkout.create;
  HnPay.prototype.checkout.create = function (payload) {
    return origCreate.call({ _base: this.baseUrl, _key: this.apiKey }, payload);
  };
  global.HnPay = HnPay;
})(typeof window !== "undefined" ? window : globalThis);
`;

export const USAGE_JS = `// Any site — one-click checkout
const hnPay = new HnPay({
  apiKey: process.env.HN_PAY_KEY,   // sk_live_xxx or sk_test_xxx
  baseUrl: "https://pay.hn",
});

const checkout = await hnPay.checkout.create({
  planCode: "pro_monthly",
  customerId: user.id,
  customerEmail: user.email,
  successUrl: "https://mysite.com/thanks",
  cancelUrl: "https://mysite.com/pricing",
});

window.location.href = checkout.url;`;

export const EDGE_TEMPLATE = `// supabase/functions/hn-pay-webhook/index.ts
// Template — receives HN-Pay events for any site
import { createHmac, timingSafeEqual } from "node:crypto";

Deno.serve(async (req) => {
  const secret = Deno.env.get("HN_PAY_WEBHOOK_SECRET")!;
  const sig = req.headers.get("x-hn-signature") ?? "";
  const body = await req.text();
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return new Response("bad signature", { status: 401 });

  const event = JSON.parse(body);
  switch (event.type) {
    case "payment.succeeded":
    case "subscription.created":
      // activate plan for event.data.customer_email
      break;
    case "subscription.canceled":
      // revoke access
      break;
  }
  return new Response("ok");
});`;

export const CHECKOUT_BUTTON = `<!-- Drop-in button — no JS build required -->
<script src="https://pay.hn/sdk/hn-pay.js"></script>
<button id="buy">Subscribe to Pro</button>
<script>
  document.getElementById("buy").addEventListener("click", async () => {
    const hn = new HnPay({ apiKey: "sk_live_xxx" });
    const s = await hn.checkout.create({
      planCode: "pro_monthly",
      customerEmail: "user@example.com",
    });
    location.href = s.url;
  });
</script>`;

export const CSV_TEMPLATE = `slug,name,domain,webhook_url,portfolio_slug,brand_color,environment
hn-chat,HN Chat,hnchat.net,https://hnchat.net/api/hn-pay/webhook,hn-ai,#f59e0b,live
hn-build,HN Build,hnbuild.io,https://hnbuild.io/api/hn-pay/webhook,hn-tools,#f59e0b,live
filmforge,FilmForge,filmforge.app,https://filmforge.app/api/hn-pay/webhook,hn-media,#e94560,live`;
