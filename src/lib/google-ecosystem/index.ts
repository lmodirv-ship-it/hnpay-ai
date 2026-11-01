// Google Ecosystem Governance layer for HN-Pay Live (browser-safe exports only).
export * from "./ga4-fintech";
export * from "./google-pay";
export * from "./adsense";

export const GOOGLE_ECOSYSTEM = {
  adsensePublisherId: "pub-3443455318197857",
  identity: { provider: "google", oneTap: true },
  syncDestinations: ["firestore", "bigquery", "sheets", "ga4"] as const,
} as const;
