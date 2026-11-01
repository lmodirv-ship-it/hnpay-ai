import { createFileRoute } from "@tanstack/react-router";
import { PaymentLanding } from "@/components/landing/PaymentLanding";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HN-PAY — Payments & subscriptions for any website" },
      { name: "description", content: "Accept payments, run subscriptions and send invoices for any website from one dashboard. Arabic, English and French." },
      { property: "og:title", content: "HN-PAY — Payments & subscriptions for any website" },
      { property: "og:description", content: "Hosted checkout, recurring billing and automatic invoices for any site or app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <PaymentLanding />
      <GoogleOneTap />
    </>
  );
}
