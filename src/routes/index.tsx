import { createFileRoute } from "@tanstack/react-router";
import { HnPayHub } from "@/components/hn-pay/HnPayHub";

export const Route = createFileRoute("/")({
  component: HnPayHub,
});
