import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: location.href, app: "" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const ok = (roles ?? []).some((r: any) => r.role === "owner" || r.role === "admin");
    if (!ok) throw redirect({ to: "/admin/unauthorized" as any });
  },
  component: () => <Outlet />,
});
