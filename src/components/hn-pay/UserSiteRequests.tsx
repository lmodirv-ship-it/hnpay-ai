import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const KINDS = [
  { v: "site", l: "إضافة موقع" },
  { v: "partner", l: "إضافة شريك" },
  { v: "tracking", l: "إضافة تتبع" },
] as const;
const STATUS: Record<string, string> = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };

export function UserSiteRequests() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<"site" | "partner" | "tracking">("site");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["my-site-requests"],
    queryFn: async () => (await supabase.from("user_site_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("سجّل الدخول أولاً");
      if (name.trim().length < 2) throw new Error("أدخل اسماً صحيحاً");
      const { error } = await supabase.from("user_site_requests").insert({ user_id: u.user.id, kind, name: name.trim().slice(0, 200), url: url.trim().slice(0, 500) || null, notes: notes.trim().slice(0, 1000) || null });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setUrl(""); setNotes(""); setErr(""); qc.invalidateQueries({ queryKey: ["my-site-requests"] }); },
    onError: (e: Error) => setErr(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("user_site_requests").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-site-requests"] }),
  });

  return (
    <section className="rounded-2xl border border-fx-line bg-fx-card p-5">
      <h2 className="mb-1 font-semibold">مواقعي وشركائي</h2>
      <p className="mb-4 text-xs text-fx-muted">أضف موقعاً أو شريكاً أو كود تتبع، وسيراجعه فريق المنصة.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k.v} onClick={() => setKind(k.v)} className={`rounded-lg border px-3 py-1.5 text-xs ${kind === k.v ? "border-fx-blue bg-fx-blue/20" : "border-fx-line text-fx-muted"}`}>{k.l}</button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2 text-sm" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={kind === "tracking" ? "معرّف التتبع (مثل G-XXXX)" : "الرابط"} dir="ltr" className="rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2 text-sm" />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات (اختياري)" className="rounded-lg border border-fx-line bg-fx-bg/60 px-3 py-2 text-sm" />
      </div>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      <button onClick={() => add.mutate()} disabled={add.isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-fx-blue px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
        <Plus className="h-4 w-4" /> إرسال
      </button>
      {data.length > 0 && (
        <ul className="mt-4 divide-y divide-fx-line/50 text-sm">
          {data.map((r: any) => (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <span className="text-xs text-fx-cyan">{KINDS.find((k) => k.v === r.kind)?.l}</span>
              <span className="flex-1">{r.name} <span className="font-mono text-[11px] text-fx-muted" dir="ltr">{r.url}</span></span>
              <span className="text-xs text-fx-muted">{STATUS[r.status]}</span>
              {r.status === "pending" && <button onClick={() => del.mutate(r.id)} aria-label="حذف"><Trash2 className="h-4 w-4 text-fx-muted" /></button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
