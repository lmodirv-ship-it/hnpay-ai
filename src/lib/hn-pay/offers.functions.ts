import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "node:crypto";

export type PublicOffer = {
  plan_id: string;
  plan_code: string;
  plan_name: string;
  description: string | null;
  amount: number;
  currency: string;
  billing_interval: string;
  trial_days: number | null;
  site_slug: string;
  site_name: string;
  brand_color: string | null;
};

export const listOffers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicOffer[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select(
        "id, code, name, description, amount, currency, billing_interval, trial_days, is_active, sites!inner(slug, name, brand_color, is_active)",
      )
      .eq("is_active", true)
      .order("amount", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((p: unknown) => {
        const row = p as { sites: { is_active: boolean } };
        return row.sites?.is_active;
      })
      .map((p: unknown) => {
        const row = p as {
          id: string;
          code: string;
          name: string;
          description: string | null;
          amount: number;
          currency: string;
          billing_interval: string;
          trial_days: number | null;
          sites: { slug: string; name: string; brand_color: string | null };
        };
        return {
          plan_id: row.id,
          plan_code: row.code,
          plan_name: row.name,
          description: row.description,
          amount: Number(row.amount),
          currency: row.currency,
          billing_interval: row.billing_interval,
          trial_days: row.trial_days,
          site_slug: row.sites.slug,
          site_name: row.sites.name,
          brand_color: row.sites.brand_color,
        };
      });
  },
);

export const startOfferCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { plan_id: string; email: string; name?: string; external_id?: string }) =>
    z
      .object({
        plan_id: z.string().uuid(),
        email: z.string().email(),
        name: z.string().max(200).optional(),
        external_id: z.string().max(128).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan, error: planErr } = await supabaseAdmin
      .from("plans")
      .select("id, site_id, code, amount, currency, is_active")
      .eq("id", data.plan_id)
      .maybeSingle();
    if (planErr || !plan || !plan.is_active) throw new Error("Plan unavailable");

    const clientToken = `ct_${randomBytes(24).toString("hex")}`;
    const clientTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: session, error } = await supabaseAdmin
      .from("checkout_sessions")
      .insert({
        site_id: plan.site_id!,
        plan_id: plan.id,
        customer_external_id: data.external_id ?? null,
        customer_email: data.email,
        customer_name: data.name ?? null,
        amount: plan.amount,
        currency: plan.currency,
        display_mode: "embedded",
        client_token: clientToken,
        client_token_expires_at: clientTokenExpiresAt,
        metadata: { source: "hn_pay_offers" } as never,
      })
      .select("public_id")
      .single();
    if (error || !session) throw new Error(error?.message ?? "Failed to create session");

    return {
      checkout_id: session.public_id,
      client_token: clientToken,
      embed_url: `/pay/embed/${session.public_id}?ct=${clientToken}`,
    };
  });
