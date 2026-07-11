
# HN-PAY — Central Payment Platform for HN Group

Goal: turn HN-PAY into a single, secure, multi-site payment gateway with a complete Arabic/English admin console that connects every HN project (unlimited sites & services) to one billing brain — CMI, NAPS, Stripe, PayPal, manual, mock — with customers, plans, invoices, renewals, reports and API keys managed in one place.

Most backend primitives already exist (`sites`, `plans`, `customers`, `checkout_sessions`, `payments`, `subscriptions`, `webhook_events`, `payment_providers`, provider registry, embedded checkout, HMAC webhooks, mock E2E flow proven). The remaining work is **finishing the admin console UI**, **adding the missing billing entities (invoices, renewals, CMI/NAPS adapters)**, and **wiring real reports per project**.

---

## Phase 1 — Payment Providers Console UI (finish what's built)
Backend (`payment-providers.functions.ts`) is done. Missing: the UI.

- New route `/_authenticated/owner/hn-pay.providers.tsx`
  - Table of providers: name · code · env · status · default · last test
  - Add / Edit drawer: `code`, `display_name`, `api_key`, `secret_key`, `webhook_secret`, `merchant_id`, `environment`
  - Actions: **Save · Test Connection · Enable/Disable · Set as Default · Delete**
  - Live status pill from `last_test_status` + `last_test_message`
- Add CMI and NAPS to the provider `code` enum + placeholder adapters (`cmi.server.ts`, `naps.server.ts`) that follow the same `PaymentProvider` interface; real signing implemented in Phase 5.
- Zero code change needed to switch active provider — checkout already reads from DB via `resolveDefaultProviderCode` / `loadProviderConfig`.

## Phase 2 — Customers & Plans Console
- `/owner/hn-pay.customers.tsx`: searchable list per site — email, external_id, MRR, active subs, last payment, lifetime value; drawer opens full customer profile with subscription & payment history.
- `/owner/hn-pay.plans.tsx`: CRUD plans per site — `code`, `name`, `amount`, `currency`, `billing_interval` (one_off / month / year / trial), trial days, active flag. Reuses existing `plans` table.
- Bulk actions: archive, duplicate, export CSV.

## Phase 3 — Invoices, Receipts & Renewals
New tables (migration):
- `invoices` — one row per successful payment or subscription cycle: `number` (HN-INV-YYYY-000123), `site_id`, `customer_id`, `subscription_id?`, `payment_id?`, `amount`, `currency`, `tax`, `status` (paid/void/refunded), `issued_at`, `pdf_url?`, `metadata`.
- `invoice_items` — line items (plan name, qty, unit price, tax).
- Trigger: on `payments.status = succeeded` → auto-create invoice.
- Renewals: pg_cron job `hn-pay-renewals` runs daily → calls internal server route to (a) email/webhook customers whose `current_period_end` is within 7/3/1 days, (b) mark expired subs `past_due`, (c) attempt provider auto-charge where supported.
- `/owner/hn-pay.invoices.tsx`: filter by site/customer/status/date, download PDF, resend receipt, mark refunded.
- Public receipt page `/receipt/$publicId` for customers (no auth).

## Phase 4 — Unified Admin Dashboard & Per-Project Reports
Consolidate into `/owner/hn-pay/` hub with tabs:
- **Overview** — global KPIs (MRR, ARR, active subs, churn, failed payments, webhook health) with filters by site & date range.
- **Sites** (exists) — per-site health & API keys.
- **Providers · Plans · Customers · Invoices · Subscriptions · Webhooks · Reports**.
- **Reports** tab: per-site P&L, revenue by plan, revenue by provider, refund rate, cohort retention; CSV + JSON export; scheduled email digests (weekly/monthly) using existing email infra.

## Phase 5 — Real Providers (CMI & NAPS first, then Stripe live)
- **CMI** (Morocco): hosted payment page adapter — build signed form POST to CMI 3DS endpoint using `merchant_id` + `secret_key`; inbound route `/api/public/v1/webhooks/cmi` verifies `HASH` and calls shared `settleCheckoutSession`.
- **NAPS**: same pattern with NAPS API signing.
- **Stripe**: existing adapter already wired; flip default to real key once tested.
- **PayPal**: order create + capture flow.
All adapters share the settlement engine → same webhooks, invoices, subs get created regardless of provider.

## Phase 6 — Customer-Facing Checkout Polish & Trust
- Unified checkout modal (already embedded) gets a provider picker showing only providers `is_enabled` for the requesting site, each with its logo, plus a security strip (HTTPS lock, HMAC signed, PCI-DSS notice, HN-PAY badge).
- AR/RTL parity across every checkout & receipt view.
- FireShield / SecureVault visual layer kept from current design.

## Phase 7 — Developer API Docs & SDK
- `/docs` route with copy-paste snippets for: creating a session, embedding checkout, verifying inbound webhooks, testing with mock provider.
- Publish `hn-pay.js` SDK v1 (already scaffolded) with typed helpers.

---

## Technical Notes

**Migrations (Phase 3):**
```
invoices(number unique, site_id, customer_id, subscription_id?, payment_id?,
         amount, currency, tax_amount, status, issued_at, pdf_url, metadata)
invoice_items(invoice_id, description, quantity, unit_amount, tax_rate)
```
All `public.*` tables ship with `GRANT` + RLS scoped by site ownership via `has_role` + site membership.

**Cron (Phase 3):** `pg_cron` + `pg_net` calling `/api/public/hooks/renewals` authenticated with `apikey` = anon key.

**Provider enum extension:** update `PROVIDER_CODES` in `payment-providers.functions.ts` and the `providers/registry.server.ts` map — no other code changes needed thanks to existing abstraction.

**Reports:** built as SQL views (`v_site_mrr`, `v_site_revenue_daily`, `v_plan_revenue`) consumed by dashboard server functions — no heavy client compute.

**Hydration bug** in `src/routes/auth.tsx` (root cause of the current runtime error) is fixed alongside Phase 1 so the admin console loads cleanly.

---

## Deliverable checklist
- [ ] Providers console UI + CMI/NAPS scaffolding
- [ ] Customers & Plans console
- [ ] Invoices + renewals + receipts + cron
- [ ] Unified dashboard + per-site reports & CSV export
- [ ] CMI & NAPS live adapters + Stripe live switch
- [ ] Bilingual checkout polish + trust badges
- [ ] Public docs & SDK v1
- [ ] Auth hydration fix

After these phases HN-PAY becomes a true central financial platform for HN Group — unlimited sites, unlimited services, one gateway, one console, one source of truth.
