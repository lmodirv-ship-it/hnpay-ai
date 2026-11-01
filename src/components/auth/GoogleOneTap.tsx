import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { X } from "lucide-react";

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (o: Record<string, unknown>) => void; prompt: () => void; cancel: () => void } } };
  }
}

const DISMISS_KEY = "hnpay_onetap_dismissed";

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Google One-Tap. With VITE_GOOGLE_CLIENT_ID set it uses the native Google Identity Services
 * popup (signInWithIdToken). Otherwise it shows an equivalent one-tap card using managed Google sign-in.
 */
export function GoogleOneTap() {
  const [card, setCard] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || data.session) return;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (!clientId) { setTimeout(() => !cancelled && setCard(true), 1500); return; }

      const raw = crypto.randomUUID();
      const hashed = await sha256Hex(raw);
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => {
        window.google?.accounts.id.initialize({
          client_id: clientId,
          nonce: hashed,
          use_fedcm_for_prompt: true,
          cancel_on_tap_outside: false,
          callback: async (resp: { credential: string }) => {
            const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: resp.credential, nonce: raw });
            if (!error) window.location.href = "/user/dashboard";
          },
        });
        window.google?.accounts.id.prompt();
      };
      document.head.appendChild(s);
    })();
    return () => { cancelled = true; window.google?.accounts.id.cancel(); };
  }, []);

  if (!card) return null;
  const dismiss = () => { sessionStorage.setItem(DISMISS_KEY, "1"); setCard(false); };
  const signIn = async () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (!r.error && !r.redirected) window.location.href = "/user/dashboard";
  };

  return (
    <div role="dialog" aria-label="Sign in with Google" className="fixed end-4 top-20 z-50 w-80 rounded-xl border border-fx-line bg-fx-bg-2 p-4 text-fx-text shadow-2xl" dir="ltr">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Sign in to HN-Pay with Google
        </div>
        <button aria-label="Close" onClick={dismiss} className="text-fx-muted"><X className="h-4 w-4" /></button>
      </div>
      <button onClick={signIn} className="w-full rounded-lg bg-fx-blue py-2 text-sm font-medium text-fx-text">Continue with Google</button>
      <p className="mt-2 text-[11px] text-fx-muted">One tap — no password needed.</p>
    </div>
  );
}
