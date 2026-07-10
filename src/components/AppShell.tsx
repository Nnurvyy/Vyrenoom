"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileBarChart2,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  Zap,
  CalendarClock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cx } from "./ui";

const NAV = [
  { href: "/peta", label: "Peta Kamar", icon: LayoutGrid, activeCls: "bg-sky text-white", chipCls: "bg-sky-soft" },
  { href: "/penghuni", label: "Penghuni", icon: Users, activeCls: "bg-mint text-ink", chipCls: "bg-mint-soft" },
  { href: "/listrik", label: "Listrik", icon: Zap, activeCls: "bg-sunny text-ink", chipCls: "bg-sunny-soft" },
  { href: "/sewa", label: "Sewa Tahunan", icon: CalendarClock, activeCls: "bg-grape text-white", chipCls: "bg-grape-soft" },
  { href: "/laporan", label: "Laporan", icon: FileBarChart2, activeCls: "bg-coral text-white", chipCls: "bg-coral-soft" },
  { href: "/notifikasi", label: "Notifikasi", icon: Bell, activeCls: "bg-peach text-ink", chipCls: "bg-coral-soft" },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, activeCls: "bg-ink text-white", chipCls: "bg-gray-200" },
];

// Item yang muncul di bottom nav HP (maks 5)
const MOBILE_NAV = NAV.slice(0, 5);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, session, account, data, unreadCount, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm font-bold text-ink/50">
        Memuat… 🏠
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-ink bg-card lg:flex">
        <div className="border-b-2 border-ink bg-sunny px-5 py-4">
          <p className="text-base font-black">🏠 Pantau Kosan</p>
          <p className="mt-0.5 truncate text-xs font-bold text-ink/60">
            {data.settings.kos_name}
          </p>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {NAV.map(({ href, label, icon: Icon, activeCls, chipCls }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-sm font-bold transition-all",
                  active
                    ? cx(
                        "border-ink shadow-[3px_3px_0_0_var(--color-ink)]",
                        activeCls
                      )
                    : "border-transparent text-ink hover:border-ink hover:bg-card"
                )}
              >
                <span
                  className={cx(
                    "flex h-7 w-7 items-center justify-center rounded-lg border-2 border-ink",
                    active ? "bg-card text-ink" : chipCls
                  )}
                >
                  <Icon size={15} />
                </span>
                <span className="flex-1">{label}</span>
                {href === "/notifikasi" && unreadCount > 0 && (
                  <span className="rounded-full border-2 border-ink bg-coral px-1.5 py-0.5 text-[10px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t-2 border-ink p-3">
          <p className="truncate px-3 pb-2 text-xs text-ink/50">
            {account?.name} · {account?.email}
          </p>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-transparent px-3 py-2 text-sm font-bold text-coral hover:border-ink hover:bg-coral-soft cursor-pointer"
          >
            <LogOut size={17} /> Keluar
          </button>
        </div>
      </aside>

      {/* Konten */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Header mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-ink bg-sunny px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="text-sm font-black">🏠 Pantau Kosan</p>
            <p className="truncate text-[11px] font-bold text-ink/60">
              {data.settings.kos_name}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/notifikasi"
              aria-label="Notifikasi"
              className="relative rounded-xl border-2 border-ink bg-card p-2 text-ink"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-coral px-1 text-[9px] font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/pengaturan"
              aria-label="Pengaturan"
              className="rounded-xl border-2 border-ink bg-card p-2 text-ink"
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:pb-8">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="grid grid-cols-5">
            {MOBILE_NAV.map(({ href, label, icon: Icon, activeCls, chipCls }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1 py-2 text-[10px] font-bold"
                >
                  <span
                    className={cx(
                      "rounded-lg border-2 px-2.5 py-1 transition-all",
                      active
                        ? cx("border-ink", activeCls)
                        : cx("border-transparent text-ink/70", chipCls)
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className={active ? "text-ink" : "text-ink/60"}>
                    {label.split(" ")[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
