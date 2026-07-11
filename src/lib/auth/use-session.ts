import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface HnRole {
  app_id: string;
  role: "owner" | "admin" | "manager" | "developer" | "subscriber" | "viewer";
}

export interface HnProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  origin_app: string | null;
}

export interface HnSessionData {
  session: Session | null;
  profile: HnProfile | null;
  roles: HnRole[];
  isOwner: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useHnSession(): HnSessionData {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<HnProfile | null>(null);
  const [roles, setRoles] = useState<HnRole[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle(),
      supabase.from("user_roles").select("app_id, role").eq("user_id", s.user.id),
    ]);
    setProfile((p as HnProfile) ?? null);
    setRoles((r as HnRole[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void load(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void load(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    profile,
    roles,
    isOwner: roles.some((r) => r.role === "owner"),
    loading,
    refresh: async () => load(session),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

export function pickPostLoginRoute(roles: HnRole[]): string {
  if (roles.some((r) => r.role === "owner" || r.role === "admin" || r.role === "manager")) return "/admin";
  return "/user/dashboard";
}
