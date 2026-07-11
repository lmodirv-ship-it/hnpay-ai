import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EVENT_TYPES = [
  "charge.succeeded",
  "charge.failed",
  "checkout.completed",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "invoice.paid",
  "invoice.failed",
  "refund.created",
] as const;

export type WebhookTestEventType = (typeof EVENT_TYPES)[number];

export const sendTestWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      siteId: string;
      eventType: WebhookTestEventType;
      overrideUrl?: string;
      payload?: Record<string, unknown>;
      persist?: boolean;
    }) =>
      z
        .object({
          siteId: z.string().uuid(),
          eventType: z.enum(EVENT_TYPES),
          overrideUrl: z.string().url().max(2048).optional().or(z.literal("")),
          payload: z.record(z.string(), z.unknown()).optional(),
          persist: z.boolean().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    // RLS-scoped read: only owners/admins or site creator will see the row.
    const { data: site, error } = await context.supabase
      .from("sites")
      .select("id, name, webhook_url, webhook_secret")
      .eq("id", data.siteId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!site) throw new Error("Site not found or not authorized");

    const targetUrl = (data.overrideUrl && data.overrideUrl.length > 0
      ? data.overrideUrl
      : site.webhook_url) as string | null;
    if (!targetUrl) {
      throw new Error("No webhook URL configured for this site. Provide an override URL.");
    }

    const { signWebhookPayload } = await import("./crypto.server");

    const eventId = `evt_test_${Math.random().toString(36).slice(2, 12)}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const finalPayload = {
      id: eventId,
      type: data.eventType,
      created_at: new Date().toISOString(),
      livemode: false,
      test: true,
      data: data.payload ?? defaultPayloadFor(data.eventType),
    };
    const rawBody = JSON.stringify(finalPayload, null, 2);
    const signature = signWebhookPayload(site.webhook_secret, timestamp, rawBody);

    const requestHeaders: Record<string, string> = {
      "content-type": "application/json",
      "x-hnpay-signature": signature,
      "x-hnpay-timestamp": String(timestamp),
      "x-hnpay-event-id": eventId,
      "x-hnpay-event-type": data.eventType,
      "x-hnpay-test": "true",
      "user-agent": "HN-PAY-Webhook-Tester/1.0",
    };

    const started = Date.now();
    let status = 0;
    let ok = false;
    let responseBody = "";
    let responseHeaders: Record<string, string> = {};
    let networkError: string | null = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: requestHeaders,
        body: rawBody,
        signal: controller.signal,
      });
      clearTimeout(timer);
      status = res.status;
      ok = res.ok;
      responseBody = (await res.text()).slice(0, 4000);
      res.headers.forEach((v, k) => {
        responseHeaders[k] = v;
      });
    } catch (err) {
      networkError = err instanceof Error ? err.message : String(err);
    }
    const durationMs = Date.now() - started;

    // Optionally persist to webhook_events so it shows up in Activity.
    if (data.persist) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("webhook_events").insert({
        site_id: site.id,
        event_type: data.eventType,
        payload: finalPayload as never,
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        last_response_status: status,
        last_response_body: (networkError ?? responseBody).slice(0, 500),
        delivered: ok,
        delivered_at: ok ? new Date().toISOString() : null,
      });
    }

    return {
      target_url: targetUrl,
      request: {
        headers: requestHeaders,
        body: rawBody,
        signature,
        timestamp,
        event_id: eventId,
      },
      response: {
        status,
        ok,
        headers: responseHeaders,
        body: responseBody,
        network_error: networkError,
        duration_ms: durationMs,
      },
    };
  });

function defaultPayloadFor(event: WebhookTestEventType): Record<string, unknown> {
  const baseCustomer = { email: "test@example.com", name: "Test Customer" };
  const baseAmount = { amount: 4900, currency: "USD" };
  switch (event) {
    case "charge.succeeded":
      return { charge_id: "ch_test_123", ...baseAmount, customer: baseCustomer, status: "succeeded" };
    case "charge.failed":
      return { charge_id: "ch_test_124", ...baseAmount, customer: baseCustomer, status: "failed", failure_message: "card_declined" };
    case "checkout.completed":
      return { session_id: "cs_test_abc", ...baseAmount, customer: baseCustomer };
    case "subscription.created":
    case "subscription.updated":
      return { subscription_id: "sub_test_1", plan_id: "pln_test", status: "active", customer: baseCustomer, ...baseAmount, interval: "month" };
    case "subscription.canceled":
      return { subscription_id: "sub_test_1", status: "canceled", customer: baseCustomer, canceled_at: new Date().toISOString() };
    case "invoice.paid":
      return { invoice_id: "in_test_1", ...baseAmount, customer: baseCustomer, status: "paid" };
    case "invoice.failed":
      return { invoice_id: "in_test_1", ...baseAmount, customer: baseCustomer, status: "uncollectible" };
    case "refund.created":
      return { refund_id: "re_test_1", charge_id: "ch_test_123", ...baseAmount, reason: "requested_by_customer" };
  }
}

export const WEBHOOK_TEST_EVENT_TYPES = EVENT_TYPES;
