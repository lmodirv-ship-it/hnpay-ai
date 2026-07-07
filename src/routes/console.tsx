import { createFileRoute } from "@tanstack/react-router";
import { OwnerConsole } from "@/components/hn-pay/console/OwnerConsole";

export const Route = createFileRoute("/console")({
  component: OwnerConsole,
  head: () => ({
    meta: [
      { title: "HN-Pay Hub · Owner Console" },
      { name: "description", content: "Command deck for the HN mesh — registry, API keys, discovery, orchestration, monitoring, analytics and AI coordination." },
      { property: "og:title", content: "HN-Pay Hub · Owner Console" },
      { property: "og:description", content: "Unified control plane for 152 HN applications." },
    ],
  }),
});
