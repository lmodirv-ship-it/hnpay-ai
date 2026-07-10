import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Generate a new API key: `sk_live_XXXXX...` (48 hex chars) */
export function generateApiKey(mode: "live" | "test" = "live"): {
  full: string;
  prefix: string;
  hash: string;
} {
  const random = randomBytes(24).toString("hex"); // 48 chars
  const full = `sk_${mode}_${random}`;
  const prefix = full.slice(0, 16);
  const hash = createHash("sha256").update(full).digest("hex");
  return { full, prefix, hash };
}

export function hashApiKey(fullKey: string): string {
  return createHash("sha256").update(fullKey).digest("hex");
}

/** Sign a webhook payload using HMAC-SHA256 over `timestamp.rawBody` */
export function signWebhookPayload(
  secret: string,
  timestamp: number,
  rawBody: string,
): string {
  const payload = `${timestamp}.${rawBody}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Verify a webhook signature (constant time) */
export function verifyWebhookSignature({
  secret,
  timestamp,
  rawBody,
  signature,
  maxAgeSeconds = 300,
}: {
  secret: string;
  timestamp: number;
  rawBody: string;
  signature: string;
  maxAgeSeconds?: number;
}): boolean {
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestamp) > maxAgeSeconds) return false;

  const expected = signWebhookPayload(secret, timestamp, rawBody);
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
