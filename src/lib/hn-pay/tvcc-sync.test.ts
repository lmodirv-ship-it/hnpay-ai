import { describe, it, expect } from "vitest";
import { normalizeDomain, slugFromDomain, tvccPayloadSchema } from "./tvcc-sync.server";
describe("tvcc sync", () => {
  it("normalizes domains", () => expect(normalizeDomain("https://www.Shop.HN-DB.com/x")).toBe("shop.hn-db.com"));
  it("slugifies", () => expect(slugFromDomain("shop.hn-db.com")).toBe("shop-hn-db-com"));
  it("rejects payloads over 2000 sites", () => {
    const sites = Array.from({ length: 2001 }, (_, i) => ({ external_id: `${i}`, domain: `s${i}.com` }));
    expect(tvccPayloadSchema.safeParse({ sites }).success).toBe(false);
  });
});
