import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const ALLOWED = ["https://payment.cmi.co.ma/fim/est3Dgate", "https://testpayment.cmi.co.ma/fim/est3Dgate"];

export const Route = createFileRoute("/pay/cmi-bridge")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    gateway: typeof s.gateway === "string" ? s.gateway : "",
    f: typeof s.f === "string" ? s.f : "",
  }),
  head: () => ({ meta: [{ title: "Redirection CMI · HN-Pay Live" }, { name: "robots", content: "noindex" }] }),
  component: CmiBridge,
});

function CmiBridge() {
  const { gateway, f } = Route.useSearch();
  const ref = useRef<HTMLFormElement>(null);
  let fields: Record<string, string> = {};
  try { fields = JSON.parse(decodeURIComponent(escape(atob(f)))); } catch { fields = {}; }
  const valid = ALLOWED.includes(gateway) && Object.keys(fields).length > 0;
  useEffect(() => { if (valid) ref.current?.submit(); }, [valid]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      {valid ? (
        <form ref={ref} method="POST" action={gateway} className="text-center">
          {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <p className="text-sm text-muted-foreground">Redirection sécurisée vers CMI…</p>
          <button type="submit" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Continuer</button>
        </form>
      ) : <p className="text-sm text-destructive">Invalid CMI request.</p>}
    </main>
  );
}
