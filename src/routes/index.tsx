import { createFileRoute } from "@tanstack/react-router";
import { HnPayHub } from "@/components/hn-pay/HnPayHub";
import { GlobalShell } from "@/components/hn-pay/GlobalShell";

export const Route = createFileRoute("/")({
  component: () => (
    <GlobalShell>
      <HnPayHub />
    </GlobalShell>
  ),
});
