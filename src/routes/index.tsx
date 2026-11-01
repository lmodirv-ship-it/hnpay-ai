import { createFileRoute } from "@tanstack/react-router";
import { GlobalShell } from "@/components/hn-pay/GlobalShell";
import { HnPayHub } from "@/components/hn-pay/HnPayHub";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HN-Pay Live — Global payments & unified subscriptions infrastructure" },
      { name: "description", content: "Accept cards, PayPal, YouCan Pay, CMI, Google Pay and the HN-Pay Wallet with smart routing and subscriptions. Arabic, French, English." },
      { property: "og:title", content: "HN-Pay Live — Global payments & unified subscriptions infrastructure" },
      { property: "og:description", content: "Smart payment routing, unified wallet and NAWAT Pass for any website — one line of code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <GlobalShell>
      <HnPayHub />
      <GoogleOneTap />
    </GlobalShell>
  );
}
