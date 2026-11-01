import { describe, it, expect } from "vitest";
import { nextStatus } from "./subscription-manage.functions";
import { resolveTopupProvider } from "./wallet-topup.functions";

describe("wallet top-up routing", () => {
  it("card in MAD goes to YouCan Pay", () => expect(resolveTopupProvider("card", "MAD")).toBe("youcan_pay"));
  it("card in EUR goes to PayPal", () => expect(resolveTopupProvider("card", "EUR")).toBe("paypal"));
  it("bank transfer stays manual", () => expect(resolveTopupProvider("bank_transfer", "USD")).toBe("manual"));
});
describe("subscription pause/resume", () => {
  it("active can pause", () => expect(nextStatus("active", "pause")).toBe("paused"));
  it("canceled cannot pause", () => expect(nextStatus("canceled", "pause")).toBeNull());
  it("paused resumes to active", () => expect(nextStatus("paused", "resume")).toBe("active"));
});
