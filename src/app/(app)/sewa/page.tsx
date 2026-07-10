"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysUntil, fmtDate, rupiah } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  usePagination,
} from "@/components/ui";
import { AnnualFormModal } from "@/components/forms";

export default function SewaPage() {
  const { data, payAnnual } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("semua");
  const [periodFilter, setPeriodFilter] = useState("semua");

  const periods = useMemo(
    () =>
      [...new Set(data.annuals.map((a) => a.period))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [data.annuals]
  );

  const annuals = useMemo(
    () =>
      data.annuals
        .filter((a) => statusFilter === "semua" || a.status === statusFilter)
        .filter((a) => periodFilter === "semua" || a.period === periodFilter)
        .sort(
          (a, b) =>
            a.status.localeCompare(b.status) ||
            b.due_date.localeCompare(a.due_date)
        ),
    [data.annuals, statusFilter, periodFilter]
  );

  const { paged, page, totalPages, setPage, total } = usePagination(annuals);

  const unpaid = data.annuals.filter((a) => a.status === "belum_bayar");
  const unpaidTotal = unpaid.reduce((s, a) => s + a.amount, 0);
  const expiringSoon = data.tenants.filter((t) => {
    if (t.status !== "aktif") return false;
    const d = daysUntil(t.end_date);
    return d >= 0 && d <= 60;
  });

  const roomNo = (id: number) =>
    data.rooms.find((r) => r.id === id)?.room_number ?? "?";
  const tenantName = (id: number) =>
    data.tenants.find((t) => t.id === id)?.name ?? "-";

  return (
    <>
      <PageHeader
        emoji="📅"
        title="Sewa Tahunan"
        subtitle="Harga sewa berbeda-beda per kamar (default Rp12.000.000/tahun)"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> Catat Sewa
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <StatCard
          label="Belum Dibayar"
          value={unpaid.length}
          color={unpaid.length ? "coral" : "mint"}
        />
        <StatCard
          label="Nilai Tunggakan"
          value={rupiah(unpaidTotal)}
          color={unpaidTotal ? "coral" : "mint"}
        />
        <StatCard
          label="Sewa Berakhir ≤ 60 hari"
          value={expiringSoon.length}
          color={expiringSoon.length ? "sunny" : "grape"}
        />
      </div>

      {expiringSoon.length > 0 && (
        <Card className="mb-4 bg-sunny-soft p-3">
          <p className="mb-1 text-xs font-black uppercase tracking-wide">
            ⏰ Masa sewa akan berakhir
          </p>
          <ul className="space-y-0.5 text-xs font-bold text-ink/70">
            {expiringSoon.map((t) => (
              <li key={t.id}>
                Kamar {roomNo(t.room_id ?? 0)} — {t.name} · berakhir{" "}
                {fmtDate(t.end_date)} ({daysUntil(t.end_date)} hari lagi)
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="!w-auto"
        >
          <option value="semua">Semua Periode</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="!w-auto"
        >
          <option value="semua">Semua Status</option>
          <option value="belum_bayar">Belum Bayar</option>
          <option value="lunas">Lunas</option>
        </Select>
      </div>

      {annuals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarClock size={32} />}
            message="Belum ada catatan sewa tahunan."
          />
        </Card>
      ) : (
        <>
          {/* Tabel desktop */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-grape-soft text-left text-xs font-black uppercase tracking-wide">
                  <th className="px-4 py-3">Kamar</th>
                  <th className="px-4 py-3">Penghuni</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3">Dibayar</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-ink/10 last:border-0"
                  >
                    <td className="px-4 py-3 font-black">{roomNo(a.room_id)}</td>
                    <td className="px-4 py-3">{tenantName(a.tenant_id)}</td>
                    <td className="px-4 py-3">{a.period}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {rupiah(a.amount)}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {fmtDate(a.due_date)}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {fmtDate(a.paid_date)}
                    </td>
                    <td className="px-4 py-3">
                      <AnnualStatus
                        status={a.status}
                        dueDate={a.due_date}
                        onPay={() => payAnnual(a.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Kartu mobile */}
          <div className="space-y-2.5 md:hidden">
            {paged.map((a) => (
              <Card key={a.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black">
                      Kamar {roomNo(a.room_id)} · {a.period}
                    </p>
                    <p className="text-xs font-bold text-ink/60">
                      {tenantName(a.tenant_id)}
                    </p>
                  </div>
                  <p className="text-sm font-black">{rupiah(a.amount)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between border-t-2 border-ink/10 pt-2">
                  <p className="text-[11px] font-bold text-ink/50">
                    Jatuh tempo {fmtDate(a.due_date)}
                    {a.paid_date && ` · dibayar ${fmtDate(a.paid_date)}`}
                  </p>
                  <AnnualStatus
                    status={a.status}
                    dueDate={a.due_date}
                    onPay={() => payAnnual(a.id)}
                  />
                </div>
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

      {showForm && <AnnualFormModal open onClose={() => setShowForm(false)} />}
    </>
  );
}

function AnnualStatus({
  status,
  dueDate,
  onPay,
}: {
  status: string;
  dueDate: string;
  onPay: () => void;
}) {
  if (status === "lunas") return <Badge tone="green">Lunas</Badge>;
  const overdue = daysUntil(dueDate) < 0;
  return (
    <div className="flex items-center gap-2">
      <Badge tone={overdue ? "red" : "amber"}>
        {overdue ? "Terlambat" : "Belum Bayar"}
      </Badge>
      <Button
        variant="mint"
        className="!px-2 !py-1 text-[11px]"
        onClick={onPay}
      >
        Tandai Lunas
      </Button>
    </div>
  );
}
