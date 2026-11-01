import { describe, it, expect } from "vitest";
import { routePayment } from "./routing-engine";
import { cmiPlainText } from "./providers/cmi.server";
import { shouldHideAds } from "../google-ecosystem/adsense";

describe("smart routing", () => {
  it("routes MAD currency to YouCan Pay then CMI", () => {
    const d = routePayment({ currency: "MAD" });
    expect(d.primary).toBe("youcan_pay");
    expect(d.fallbacks[0]).toBe("cmi");
  });
  it("routes country MA to YouCan Pay", () => {
    expect(routePayment({ country: "MA", currency: "EUR" }).primary).toBe("youcan_pay");
  });
  it("routes global SaaS_AI to PayPal", () => {
    expect(routePayment({ country: "FR", currency: "EUR", appCategory: "SaaS_AI" }).primary).toBe("paypal");
  });
  it("always offers PayPal as the final fallback", () => {
    expect(routePayment({ country: "US", currency: "USD" }).fallbacks).toContain("paypal");
  });
  it("respects site allowed providers", () => {
    expect(routePayment({ currency: "MAD", allowed: ["cmi", "paypal"] }).primary).toBe("cmi");
  });
});

describe("CMI ver3 hash input", () => {
  it("sorts keys case-insensitively, skips hash/encoding, escapes | and \\", () => {
    expect(cmiPlainText({ b: "2", A: "x|y", encoding: "UTF-8", hash: "z" }, "k\\ey")).toBe("x\\|y|2|k\\\\ey");
  });
});

describe("AdSense governance", () => {
  it("hides ads for active subscribers", () => {
    expect(shouldHideAds({ adsenseEnabled: true, hasActivePlan: true })).toBe(true);
    expect(shouldHideAds({ adsenseEnabled: true, hasActivePlan: false })).toBe(false);
  });
});
