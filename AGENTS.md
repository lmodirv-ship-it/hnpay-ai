<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Payment provider selection goes through the pure `src/lib/hn-pay/routing-engine.ts` (DB `routing_rules` override defaults; PayPal is the universal last fallback) — keeps routing testable and consistent across checkout, admin simulator and SDK.
- Google integrations live in `src/lib/google-ecosystem/` (browser-safe) and queue server events into `google_sync_events`; a cron-protected route drains them — Google outages never block payments.
- Wallet balances change only via the `wallet_apply` SECURITY DEFINER function (service_role only) — guarantees atomic, non-negative balances.
