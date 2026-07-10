import { signWebhookPayload } from "./crypto.server";

type SupabaseAdmin = Awaited<
  ReturnType<typeof import("@/integrations/supabase/client.server").getSupabaseAdmin>
>;

type EnqueueArgs = {
  admin: SupabaseAdmin;
  siteId: string;
  eventType: string;
  data: Record<string, unknown>;
};

/**
 * Insert a webhook_event row AND best-effort attempt immediate delivery.
 * Any failure is captured on the row for retry.
 */
export async function enqueueAndDeliver({
  admin,
  siteId,
  eventType,
  data,
}: EnqueueArgs): Promise<{ event_id: string; delivered: boolean }> {
  const payload = {
    type: eventType,
    created_at: new Date().toISOString(),
    data,
  };

  const { data: inserted, error } = await admin
    .from("webhook_events")
    .insert({ site_id: siteId, event_type: eventType, payload })
    .select("id, public_id, payload")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to enqueue webhook: ${error?.message}`);
  }

  const { data: site } = await admin
    .from("sites")
    .select("webhook_url, webhook_secret")
    .eq("id", siteId)
    .maybeSingle();

  if (!site?.webhook_url) {
    return { event_id: inserted.public_id, delivered: false };
  }

  const finalPayload = { ...(inserted.payload as object), id: inserted.public_id };
  const rawBody = JSON.stringify(finalPayload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhookPayload(site.webhook_secret, timestamp, rawBody);

  let status = 0;
  let body = "";
  let ok = false;
  try {
    const res = await fetch(site.webhook_url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hnpay-signature": signature,
        "x-hnpay-timestamp": String(timestamp),
        "x-hnpay-event-id": inserted.public_id,
      },
      body: rawBody,
    });
    status = res.status;
    body = (await res.text()).slice(0, 500);
    ok = res.ok;
  } catch (err) {
    body = String(err).slice(0, 500);
  }

  await admin
    .from("webhook_events")
    .update({
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
      last_response_status: status,
      last_response_body: body,
      delivered: ok,
      delivered_at: ok ? new Date().toISOString() : null,
    })
    .eq("id", inserted.id);

  return { event_id: inserted.public_id, delivered: ok };
}
