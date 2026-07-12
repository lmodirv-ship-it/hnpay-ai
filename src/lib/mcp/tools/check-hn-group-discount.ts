import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "check_hn_group_discount",
  title: "Check HN group discount eligibility",
  description:
    "Preview whether a buyer qualifies for the HN-group cross-benefit (100% internal discount) on a given plan BEFORE creating a checkout session. Returns final amount, currency, eligibility flag, and a machine-readable reason.",
  inputSchema: {
    plan_code: z.string().min(1).max(64).describe("Plan code as defined on the target site."),
    site_slug: z
      .string()
      .min(1)
      .max(120)
      .optional()
      .describe("Site slug that owns the plan. Provide this OR site_id."),
    site_id: z.string().uuid().optional().describe("Site UUID. Provide this OR site_slug."),
    customer_email: z
      .string()
      .email()
      .max(255)
      .describe("Buyer email — the address checked against the HN group members registry."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!input.site_slug && !input.site_id) {
      return {
        content: [{ type: "text", text: "Provide either site_slug or site_id." }],
        isError: true,
      };
    }

    const sb = supabaseForUser(ctx);

    // Resolve site
    let siteQ = sb
      .from("sites")
      .select("id, slug, name, is_group_site")
      .limit(1);
    siteQ = input.site_id ? siteQ.eq("id", input.site_id) : siteQ.eq("slug", input.site_slug!);
    const { data: siteRow, error: siteErr } = await siteQ.maybeSingle();
    if (siteErr) {
      return { content: [{ type: "text", text: `Site lookup failed: ${siteErr.message}` }], isError: true };
    }
    if (!siteRow) {
      return {
        content: [{ type: "text", text: "Site not found or not visible to the signed-in user." }],
        isError: true,
      };
    }

    // Resolve plan on that site
    const { data: plan, error: planErr } = await sb
      .from("plans")
      .select("id, code, name, amount, currency, is_active, share_with_group")
      .eq("site_id", siteRow.id)
      .eq("code", input.plan_code)
      .maybeSingle();
    if (planErr) {
      return { content: [{ type: "text", text: `Plan lookup failed: ${planErr.message}` }], isError: true };
    }
    if (!plan) {
      return {
        content: [{ type: "text", text: `Plan '${input.plan_code}' not found on site '${siteRow.slug}'.` }],
        isError: true,
      };
    }

    const originalAmount = Number(plan.amount);
    const currency = plan.currency;

    // Membership check
    const { data: isMember, error: memberErr } = await sb.rpc("is_hn_group_email", {
      _email: input.customer_email,
    });
    if (memberErr) {
      return { content: [{ type: "text", text: `Membership check failed: ${memberErr.message}` }], isError: true };
    }

    // Same eligibility logic as /api/public/v1/checkout-sessions
    const planShared = plan.share_with_group !== false;
    const siteInGroup = siteRow.is_group_site === true;
    const memberOk = isMember === true;
    const planActive = plan.is_active === true;

    let eligible = false;
    let reason: string;
    if (!planActive) {
      reason = "plan_inactive";
    } else if (!memberOk) {
      reason = "buyer_not_group_member";
    } else if (!siteInGroup) {
      reason = "site_not_in_hn_group";
    } else if (!planShared) {
      reason = "plan_not_shared_with_group";
    } else {
      eligible = true;
      reason = "hn_group_cross_benefit";
    }

    const finalAmount = eligible ? 0 : originalAmount;
    const discountAmount = originalAmount - finalAmount;

    const out = {
      eligible,
      reason,
      reason_ar: reasonAr(reason),
      site: { id: siteRow.id, slug: siteRow.slug, name: siteRow.name, is_group_site: siteInGroup },
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        is_active: planActive,
        share_with_group: planShared,
      },
      buyer: { email: input.customer_email, is_group_member: memberOk },
      pricing: {
        currency,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      structuredContent: out,
    };
  },
});

function reasonAr(code: string): string {
  switch (code) {
    case "hn_group_cross_benefit":
      return "خصم 100% — استفادة متبادلة داخل مجموعة HN.";
    case "buyer_not_group_member":
      return "البريد غير مسجّل كعضو في مجموعة HN.";
    case "site_not_in_hn_group":
      return "الموقع غير مُفعَّل ضمن مجموعة HN.";
    case "plan_not_shared_with_group":
      return "الخطة لا تُشارك مع أعضاء المجموعة.";
    case "plan_inactive":
      return "الخطة غير نشطة.";
    default:
      return "غير محدد.";
  }
}
