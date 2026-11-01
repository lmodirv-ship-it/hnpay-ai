// Google Cloud sync bridge — queues every financial event into public.google_sync_events.
// A worker (cron → /api/public/v1/google/sync) drains the queue to Firestore / BigQuery / Sheets / GA4.
// Server-only: import dynamically from handlers.

export type GoogleDestination = "firestore" | "bigquery" | "ga4" | "sheets";
export type SyncEventType = "transaction" | "invoice" | "subscription" | "audit_log" | "wallet";

export async function enqueueGoogleSync(eventType: SyncEventType, payload: Record<string, unknown>, destinations: GoogleDestination[] = ["firestore", "bigquery"]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows = destinations.map((d) => ({ event_type: eventType, payload: payload as never, google_destination: d }));
  const { error } = await supabaseAdmin.from("google_sync_events").insert(rows);
  if (error) console.error("[google-sync] enqueue failed", error.message);
}

/** Drains pending events. Delivery uses a Google-side webhook bridge (Apps Script / Cloud Function) set in GOOGLE_SYNC_WEBHOOK_URL. */
export async function drainGoogleSync(limit = 100) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const url = process.env.GOOGLE_SYNC_WEBHOOK_URL;
  const { data: rows } = await supabaseAdmin
    .from("google_sync_events").select("*").eq("sync_status", "pending")
    .order("created_at").limit(limit);
  let synced = 0, failed = 0;
  for (const r of rows ?? []) {
    if (!url) { failed++; await supabaseAdmin.from("google_sync_events").update({ attempts: r.attempts + 1, last_error: "GOOGLE_SYNC_WEBHOOK_URL not configured" }).eq("id", r.id); continue; }
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      synced++;
      await supabaseAdmin.from("google_sync_events").update({ sync_status: "synced", synced_at: new Date().toISOString(), attempts: r.attempts + 1 }).eq("id", r.id);
    } catch (e) {
      failed++;
      await supabaseAdmin.from("google_sync_events").update({
        sync_status: r.attempts + 1 >= 5 ? "failed" : "pending", attempts: r.attempts + 1, last_error: String((e as Error).message),
      }).eq("id", r.id);
    }
  }
  return { processed: rows?.length ?? 0, synced, failed };
}
