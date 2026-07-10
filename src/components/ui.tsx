"use client";

import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Badge status ---------- */
const badgeTones = {
  green: "bg-mint text-ink",
  red: "bg-coral text-white",
  amber: "bg-sunny text-ink",
  gray: "bg-gray-200 text-ink/70",
  teal: "bg-sky text-white",
  grape: "bg-grape text-white",
} as const;

export function Badge({
  tone,
  children,
}: {
  tone: keyof typeof badgeTones;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-bold whitespace-nowrap",
        badgeTones[tone]
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Button ---------- */
export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "sunny" | "mint";
}) {
  const solid =
    "border-2 border-ink shadow-[3px_3px_0_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: cx("bg-sky text-white", solid),
    sunny: cx("bg-sunny text-ink", solid),
    mint: cx("bg-mint text-ink", solid),
    danger: cx("bg-coral text-white", solid),
    outline: cx("bg-card text-ink", solid),
    ghost: "text-ink/70 hover:bg-ink/5",
  } as const;
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-all cursor-pointer",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

/* ---------- Card ---------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border-2 border-ink bg-card shadow-[4px_4px_0_0_var(--color-ink)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  emoji,
  subtitle,
  action,
}: {
  title: string;
  emoji?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-black sm:text-xl">
          {emoji && <span aria-hidden>{emoji}</span>}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink/60 sm:text-sm">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------- Stat card ---------- */
const statColors = {
  sky: "bg-sky-soft",
  mint: "bg-mint-soft",
  sunny: "bg-sunny-soft",
  coral: "bg-coral-soft",
  grape: "bg-grape-soft",
  plain: "bg-card",
} as const;

export function StatCard({
  label,
  value,
  hint,
  color = "plain",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  color?: keyof typeof statColors;
}) {
  return (
    <Card className={cx("p-3 sm:p-4", statColors[color])}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink/60 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-lg font-black sm:text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink/60">{hint}</p>}
    </Card>
  );
}

/* ---------- Modal (bottom sheet di HP, dialog di desktop) ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border-2 border-ink bg-card sm:max-w-lg sm:rounded-3xl sm:shadow-[6px_6px_0_0_var(--color-ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-ink bg-sunny px-4 py-3 sm:px-5">
          <h2 className="text-sm font-black sm:text-base">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg border-2 border-ink bg-card p-1 text-ink hover:bg-coral hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Form field ---------- */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink/70">{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-ink/50">{hint}</span>
      )}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm outline-none transition-shadow focus:shadow-[3px_3px_0_0_var(--color-sky)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, props.className)} />;
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon,
  message,
}: {
  icon?: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-ink/40">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ---------- Alert error kecil ---------- */
export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-xl border-2 border-ink bg-coral-soft px-3 py-2 text-xs font-bold text-ink">
      ⚠️ {children}
    </p>
  );
}

/* ---------- Pagination (10 per halaman) ---------- */
export const PAGE_SIZE = 10;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  // Kembali ke halaman terakhir yang valid bila data menyusut
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  return { paged, page: safePage, totalPages, setPage, total: items.length };
}

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= PAGE_SIZE) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[11px] font-bold text-ink/60">
        {start}–{end} dari {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className="rounded-lg border-2 border-ink bg-card p-1.5 disabled:opacity-30 enabled:hover:bg-sunny enabled:cursor-pointer"
        >
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
          )
          .reduce<(number | "…")[]>((acc, p) => {
            const prev = acc[acc.length - 1];
            if (typeof prev === "number" && p - prev > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`gap${i}`} className="px-1 text-xs text-ink/40">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={cx(
                  "min-w-8 rounded-lg border-2 border-ink px-2 py-1 text-xs font-bold cursor-pointer",
                  p === page ? "bg-sky text-white" : "bg-card hover:bg-sunny"
                )}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
          className="rounded-lg border-2 border-ink bg-card p-1.5 disabled:opacity-30 enabled:hover:bg-sunny enabled:cursor-pointer"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
