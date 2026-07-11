import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/unauthorized")({
  ssr: false,
  head: () => ({ meta: [{ title: "ممنوع الوصول · HN-PAY" }] }),
  component: () => (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#05060d] px-6 text-white">
      <div className="max-w-md rounded-2xl border border-rose-400/30 bg-rose-500/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-300" />
        <h1 className="mt-4 text-xl font-bold">ليست لديك صلاحية</h1>
        <p className="mt-2 text-sm text-neutral-400">لوحة تحكم HN-PAY متاحة فقط لأصحاب دور <b>Owner</b> أو <b>Admin</b>.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/user/dashboard" className="rounded-lg border border-white/10 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5">لوحتي</Link>
          <Link to="/" className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 hover:bg-amber-500/20">الرئيسية</Link>
        </div>
      </div>
    </div>
  ),
});
