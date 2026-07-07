import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_60px_-40px_rgba(251,191,36,0.35)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {desc && <p className="mt-1.5 max-w-2xl text-sm text-neutral-400">{desc}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "amber",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "amber" | "emerald" | "sky" | "rose" | "violet";
}) {
  const tones: Record<string, string> = {
    amber: "text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.35)] border-amber-400/40 bg-amber-500/10",
    emerald: "text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.35)] border-emerald-400/40 bg-emerald-500/10",
    sky: "text-sky-300 shadow-[0_0_30px_rgba(14,165,233,0.35)] border-sky-400/40 bg-sky-500/10",
    rose: "text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.35)] border-rose-400/40 bg-rose-500/10",
    violet: "text-violet-300 shadow-[0_0_30px_rgba(139,92,246,0.35)] border-violet-400/40 bg-violet-500/10",
  };
  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            {label}
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{value}</div>
          {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          {icon}
        </div>
      </div>
    </Panel>
  );
}

export function StatusDot({ status }: { status: "online" | "degraded" | "offline" }) {
  const map = {
    online: "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]",
    degraded: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]",
    offline: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status]}`} />;
}

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "amber" | "emerald" | "sky" | "rose" | "violet";
}) {
  const tones: Record<string, string> = {
    neutral: "border-white/10 bg-white/5 text-neutral-300",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-200",
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    violet: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
  type?: "button" | "submit";
  className?: string;
}) {
  const variants = {
    primary:
      "border-amber-400/50 bg-gradient-to-b from-amber-400/25 to-amber-500/10 text-amber-100 hover:from-amber-400/35 hover:to-amber-500/20 shadow-[0_0_25px_-8px_rgba(251,191,36,0.7)]",
    ghost: "border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.06]",
    outline: "border-amber-500/30 bg-transparent text-amber-200 hover:bg-amber-500/10",
    danger: "border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border font-medium transition ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  className = "",
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-amber-400/50 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.12)] ${className}`}
    />
  );
}
