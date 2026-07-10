"use client";

import { useMemo, useState } from "react";
import { Bell, BellOff, CalendarClock, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  cx,
  usePagination,
} from "@/components/ui";

type Tab = "belum" | "semua";

export default function NotifikasiPage() {
  const { data, unreadCount, markNotifRead, markAllNotifsRead } = useStore();
  const [tab, setTab] = useState<Tab>("belum");

  const notifs = useMemo(
    () =>
      data.notifications
        .filter((n) => (tab === "belum" ? n.status === "unread" : true))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [data.notifications, tab]
  );

  const { paged, page, totalPages, setPage, total } = usePagination(notifs);

  return (
    <>
      <PageHeader
        emoji="🔔"
        title="Notifikasi Tagihan"
        subtitle="Pengingat listrik jatuh tempo & sewa tahunan akan berakhir"
        action={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllNotifsRead()}>
              Tandai semua dibaca
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        {(
          [
            { key: "belum", label: `Belum Dibaca (${unreadCount})` },
            { key: "semua", label: `Riwayat (${data.notifications.length})` },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold cursor-pointer",
              tab === t.key
                ? t.key === "belum"
                  ? "bg-coral text-white"
                  : "bg-sky text-white"
                : "bg-card hover:bg-sunny-soft"
            )}
          >
            {t.key === "belum" ? "📬 " : "🗂️ "}
            {t.label}
          </button>
        ))}
      </div>

      {notifs.length === 0 ? (
        <Card>
          <EmptyState
            icon={tab === "belum" ? <BellOff size={32} /> : <Bell size={32} />}
            message={
              tab === "belum"
                ? "Tidak ada notifikasi baru. Semua aman! ✨"
                : "Belum ada riwayat notifikasi."
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-2.5">
            {paged.map((n) => (
              <Card
                key={n.id}
                className={cx(
                  "flex items-start gap-3 p-3",
                  n.status === "unread" && "bg-peach/20"
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 rounded-xl border-2 border-ink p-2",
                    n.type === "listrik" ? "bg-sunny" : "bg-grape-soft"
                  )}
                >
                  {n.type === "listrik" ? (
                    <Zap size={16} />
                  ) : (
                    <CalendarClock size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={n.type === "listrik" ? "amber" : "grape"}>
                      {n.type === "listrik" ? "Listrik" : "Sewa Tahunan"}
                    </Badge>
                    <span className="text-[11px] text-ink/40">
                      {fmtDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed sm:text-sm">
                    {n.message}
                  </p>
                </div>
                {n.status === "unread" && (
                  <button
                    onClick={() => markNotifRead(n.id)}
                    className="shrink-0 text-[11px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    Tandai dibaca
                  </button>
                )}
              </Card>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
