import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/public/v1/google/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HN_CRON_SECRET ?? "";
        const got = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        const a = Buffer.from(got), b = Buffer.from(secret);
        if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Unauthorized", { status: 401 });
        const { drainGoogleSync } = await import("@/lib/google-ecosystem/google-cloud-sync");
        return Response.json(await drainGoogleSync());
      },
    },
  },
});
