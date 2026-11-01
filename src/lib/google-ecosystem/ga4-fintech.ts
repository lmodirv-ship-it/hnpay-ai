// GA4 Enhanced FinTech Ecommerce — browser-side event emitter (call from effects / handlers only).

export type Ga4FintechEvent = "begin_checkout" | "add_payment_info" | "purchase" | "subscribe" | "refund" | "wallet_topup";

export type Ga4Params = {
  value: number;
  currency: string;
  transaction_id?: string;
  app_id?: string;
  payment_type?: string;
  items?: { item_id: string; item_name: string; price: number; quantity?: number }[];
};

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag }
}

export function buildGa4Payload(event: Ga4FintechEvent, p: Ga4Params) {
  return {
    event,
    value: Math.round(Number(p.value) * 100) / 100,
    currency: p.currency.toUpperCase(),
    ...(p.transaction_id ? { transaction_id: p.transaction_id } : {}),
    ...(p.app_id ? { app_id: p.app_id } : {}),
    ...(p.payment_type ? { payment_type: p.payment_type } : {}),
    ...(p.items ? { items: p.items } : {}),
  };
}

/** Loads gtag.js once for a GA4 measurement id. */
export function initGa4(measurementId: string) {
  if (typeof window === "undefined" || !measurementId || window.gtag) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer!.push(arguments); } as Gtag;
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

export function trackFintech(event: Ga4FintechEvent, p: Ga4Params) {
  if (typeof window === "undefined") return;
  const { event: name, ...params } = buildGa4Payload(event, p);
  if (window.gtag) window.gtag("event", name, params);
  else (window.dataLayer = window.dataLayer || []).push({ event: name, ...params });
}
