import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Card, Section, Badge, EmptyState } from "@/components/admin/AdminShell";
import {
  listProjects,
  createProject,
  deleteProject,
  addProjectDomain,
  updateProjectDomain,
  removeProjectDomain,
  bulkImportProjects,
} from "@/lib/hn-pay/projects.functions";
import {
  Plus,
  Upload,
  Trash2,
  Globe,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FolderKanban,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  ssr: false,
  head: () => ({ meta: [{ title: "المشاريع · HN-PAY" }] }),
  component: ProjectsPage,
});

type DomainRow = {
  id: string;
  project_id: string;
  domain: string;
  domain_type: string;
  is_primary: boolean;
  payments_enabled: boolean;
  environment: string;
  verification_status: string;
};

type ProjectRow = {
  id: string;
  name: string;
  code: string;
  category: string | null;
  primary_domain: string | null;
  status: string;
  default_currency: string;
  brand_color: string | null;
  description: string | null;
  created_at: string;
  domains: DomainRow[];
  domain_count: number;
};

function ProjectsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProjects);
  const createFn = useServerFn(createProject);
  const delFn = useServerFn(deleteProject);
  const bulkFn = useServerFn(bulkImportProjects);

  const { data: projects = [], isLoading } = useQuery<ProjectRow[]>({
    queryKey: ["hn-pay", "projects"],
    queryFn: () => listFn() as Promise<ProjectRow[]>,
  });

  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hn-pay", "projects"] }),
  });

  return (
    <AdminShell
      title="المشاريع المالية"
      subtitle="كل مشروع من مجموعة HN يجمع تحته نطاقاته الرئيسية والفرعية وتطبيقاته."
      actions={
        <>
          <button
            onClick={() => setImporting((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            <Upload className="h-4 w-4" /> استيراد جماعي
          </button>
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
          >
            <Plus className="h-4 w-4" /> مشروع جديد
          </button>
        </>
      }
    >
      {importing && (
        <BulkImportPanel
          onDone={() => {
            setImporting(false);
            qc.invalidateQueries({ queryKey: ["hn-pay", "projects"] });
          }}
          runImport={(rows) => bulkFn({ data: { rows } })}
        />
      )}

      {creating && (
        <CreateProjectForm
          onCancel={() => setCreating(false)}
          onCreate={async (values) => {
            await createFn({ data: values });
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["hn-pay", "projects"] });
          }}
        />
      )}

      <Section title={`المشاريع (${projects.length})`}>
        {isLoading ? (
          <div className="text-sm text-neutral-500">جاري التحميل…</div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="لا توجد مشاريع بعد"
            desc="أنشئ مشروعك الأول أو استخدم الاستيراد الجماعي لإضافة كل مشاريع HN دفعة واحدة."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={() => del.mutate(p.id)} />
            ))}
          </div>
        )}
      </Section>
    </AdminShell>
  );
}

function ProjectCard({ project, onDelete }: { project: ProjectRow; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const addDomainFn = useServerFn(addProjectDomain);
  const updateDomainFn = useServerFn(updateProjectDomain);
  const removeDomainFn = useServerFn(removeProjectDomain);

  const [newDomain, setNewDomain] = useState("");
  const [newType, setNewType] = useState("app");
  const [newPay, setNewPay] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["hn-pay", "projects"] });

  const paymentsCount = project.domains.filter((d) => d.payments_enabled).length;
  const color = project.brand_color ?? "#f59e0b";

  return (
    <Card className="!p-0 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-right hover:bg-white/[0.02]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-bold"
            style={{ borderColor: `${color}55`, background: `${color}15`, color }}
          >
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold">
              {project.name}
              <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                {project.code}
              </span>
              {project.category && <Badge tone="violet">{project.category}</Badge>}
            </div>
            <div className="mt-0.5 truncate text-xs text-neutral-500">
              {project.primary_domain ?? "بدون نطاق رئيسي"} · {project.domain_count} نطاق · {paymentsCount} تفعّل الدفع
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={project.status === "active" ? "green" : "neutral"}>{project.status}</Badge>
          {open ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 -scale-x-100 text-neutral-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              النطاقات ({project.domain_count})
            </div>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3 w-3" /> حذف المشروع
            </button>
          </div>

          {project.domains.length === 0 ? (
            <div className="rounded border border-dashed border-white/10 p-4 text-center text-xs text-neutral-500">
              لا توجد نطاقات مرتبطة بعد
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-neutral-400">
                  <tr>
                    <th className="p-2 text-right">النطاق</th>
                    <th className="p-2 text-right">النوع</th>
                    <th className="p-2 text-right">البيئة</th>
                    <th className="p-2 text-right">الدفع</th>
                    <th className="p-2 text-right">التحقق</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {project.domains.map((d) => (
                    <tr key={d.id} className="border-t border-white/5">
                      <td className="p-2 font-mono">
                        {d.domain}
                        {d.is_primary && <Badge tone="amber">أساسي</Badge>}
                      </td>
                      <td className="p-2 text-neutral-400">{d.domain_type}</td>
                      <td className="p-2 text-neutral-400">{d.environment}</td>
                      <td className="p-2">
                        <button
                          onClick={async () => {
                            await updateDomainFn({ data: { id: d.id, payments_enabled: !d.payments_enabled } });
                            refresh();
                          }}
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] ${
                            d.payments_enabled
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                              : "border-neutral-600/40 bg-neutral-800/40 text-neutral-400"
                          }`}
                        >
                          {d.payments_enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {d.payments_enabled ? "مفعّل" : "معطّل"}
                        </button>
                      </td>
                      <td className="p-2 text-neutral-400">{d.verification_status}</td>
                      <td className="p-2 text-left">
                        <button
                          onClick={async () => {
                            await removeDomainFn({ data: { id: d.id } });
                            refresh();
                          }}
                          className="text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_140px_140px_auto]">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="admin.example.com"
              className="rounded border border-white/10 bg-black/60 px-3 py-2 text-xs"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded border border-white/10 bg-black/60 px-2 py-2 text-xs"
            >
              <option value="app">app</option>
              <option value="admin">admin</option>
              <option value="api">api</option>
              <option value="client_app">client_app</option>
              <option value="marketing">marketing</option>
              <option value="alias">alias</option>
              <option value="alt">alt</option>
            </select>
            <label className="flex items-center gap-2 rounded border border-white/10 bg-black/60 px-2 py-2 text-xs text-neutral-300">
              <input type="checkbox" checked={newPay} onChange={(e) => setNewPay(e.target.checked)} />
              تفعيل الدفع
            </label>
            <button
              onClick={async () => {
                if (!newDomain.trim()) return;
                await addDomainFn({
                  data: {
                    project_id: project.id,
                    domain: newDomain.trim(),
                    domain_type: newType,
                    payments_enabled: newPay,
                  },
                });
                setNewDomain("");
                setNewPay(false);
                refresh();
              }}
              className="rounded bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:brightness-110"
            >
              إضافة
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function CreateProjectForm({
  onCreate,
  onCancel,
}: {
  onCreate: (v: {
    name: string;
    code: string;
    category?: string;
    primary_domain?: string;
    default_currency?: string;
    brand_color?: string;
    description?: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    category: "",
    primary_domain: "",
    default_currency: "USD",
    brand_color: "#f59e0b",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-black/40 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-200">
        <FolderKanban className="h-4 w-4" /> مشروع مالي جديد
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="الاسم">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HN Driver" className="input" />
        </Field>
        <Field label="الكود (a-z0-9_)">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} placeholder="hn_driver" className="input font-mono" />
        </Field>
        <Field label="الفئة">
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="transport, saas, media…" className="input" />
        </Field>
        <Field label="النطاق الرئيسي">
          <input value={form.primary_domain} onChange={(e) => setForm({ ...form, primary_domain: e.target.value })} placeholder="hn-driver.com" className="input" />
        </Field>
        <Field label="العملة">
          <input value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value.toUpperCase() })} className="input" />
        </Field>
        <Field label="اللون">
          <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="h-10 w-24 rounded border border-white/10 bg-black/60" />
        </Field>
        <Field label="الوصف" className="md:col-span-2">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input" />
        </Field>
      </div>
      {err && <div className="mt-3 rounded border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">{err}</div>}
      <div className="mt-4 flex gap-2">
        <button
          disabled={saving || !form.name || !form.code}
          onClick={async () => {
            setErr(null);
            setSaving(true);
            try {
              await onCreate({
                name: form.name,
                code: form.code,
                category: form.category || undefined,
                primary_domain: form.primary_domain || undefined,
                default_currency: form.default_currency || undefined,
                brand_color: form.brand_color,
                description: form.description || undefined,
              });
            } catch (e) {
              setErr(e instanceof Error ? e.message : String(e));
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "جاري الحفظ…" : "إنشاء المشروع"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5">
          إلغاء
        </button>
      </div>
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.6);padding:0.5rem 0.75rem;font-size:0.75rem;color:#e5e5e5;outline:none}.input:focus{border-color:rgba(251,191,36,0.5)}`}</style>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      {children}
    </label>
  );
}

const SAMPLE_CSV = `project_name,project_code,primary_domain,domain,type,environment,payments_enabled,category
HN-DB,hn_db,hn-db.fun,hn-db.fun,saas,production,true,database
HN-DB,hn_db,hn-db.fun,admin.hn-db.fun,admin,production,false,database
HN-DB,hn_db,hn-db.fun,api.hn-db.fun,api,production,false,database
HN Driver,hn_driver,hn-driver.com,hn-driver.com,transport,production,true,transport
HN Driver,hn_driver,hn-driver.com,client.hn-driver.com,client_app,production,true,transport
HN Driver,hn_driver,hn-driver.com,admin.hn-driver.com,admin,production,false,transport
Tanja Print,tanja_print,tanjaprint.com,tanjaprint.com,printing,production,true,printing
`;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

function BulkImportPanel({
  onDone,
  runImport,
}: {
  onDone: () => void;
  runImport: (rows: Record<string, string>[]) => Promise<{
    projectsCreated: number;
    domainsCreated: number;
    domainsSkipped: number;
    errors: { row: number; domain?: string; error: string }[];
  }>;
}) {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runImport>> | null>(null);

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.readAsText(f);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const rows = parseCSV(csv);
      const r = await runImport(rows);
      setResult(r);
      if (r.errors.length === 0) onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-black/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-200">
            <Globe className="h-4 w-4" /> استيراد جماعي للمشاريع والنطاقات
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            الأعمدة: <span className="font-mono">project_name, project_code, primary_domain, domain, type, environment, payments_enabled, category</span>.
            المشروع الواحد يمكن أن يتكرر لعدة نطاقات — سيُنشأ مرة واحدة فقط.
          </div>
        </div>
        <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10">
          اختر CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </div>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={10}
        className="w-full rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-neutral-200"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "جاري الاستيراد…" : "استيراد"}
        </button>
      </div>
      {result && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs">
          <div className="text-neutral-300">
            <span className="text-emerald-300">{result.projectsCreated}</span> مشروع جديد ·{" "}
            <span className="text-emerald-300">{result.domainsCreated}</span> نطاق مضاف ·{" "}
            <span className="text-neutral-400">{result.domainsSkipped}</span> موجود مسبقًا ·{" "}
            <span className="text-rose-300">{result.errors.length}</span> خطأ
          </div>
          {result.errors.slice(0, 15).map((e, i) => (
            <div key={i} className="mt-1 text-neutral-500">
              سطر {e.row} <span className="font-mono text-neutral-300">{e.domain}</span>: {e.error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
