"use client";

import { useMemo, useState } from "react";
import { Plus, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysUntil, fmtDate, fmtPeriod, rupiah } from "@/lib/format";
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
import { BillFormModal } from "@/components/forms";

export default function ListrikPage() {
  const { data, payBill } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");

  const periods = useMemo(
    () =>
      [...new Set(data.bills.map((b) => b.period))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [data.bills]
  );

  const bills = useMemo(
    () =>
      data.bills
        .filter((b) => periodFilter === "semua" || b.period === periodFilter)
        .filter((b) => statusFilter === "semua" || b.status === statusFilter)
        .sort(
          (a, b) =>
            b.period.localeCompare(a.period) ||
            a.status.localeCompare(b.status)
        ),
    [data.bills, periodFilter, statusFilter]
  );

  const { paged, page, totalPages, setPage, total } = usePagination(bills);

  const unpaid = data.bills.filter((b) => b.status === "belum_bayar");
  const unpaidTotal = unpaid.reduce((s, b) => s + b.amount, 0);

  const roomNo = (id: number) =>
    data.rooms.find((r) => r.id === id)?.room_number ?? "?";
  const tenantName = (id: number) =>
    data.tenants.find((t) => t.id === id)?.name ?? "-";

  return (
    <>
      <PageHeader
        emoji="⚡"
        title="Tagihan Listrik"
        subtitle={`Tarif tetap: ${rupiah(data.settings.electricity_rate)}/bulan`}
        action={
          <Button variant="sunny" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Catat Tagihan
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <StatCard
          label="Total Tagihan"
          value={data.bills.length}
          color="sky"
          emoji="🧾"
        />
        <StatCard
          label="Belum Dibayar"
          value={unpaid.length}
          color={unpaid.length ? "coral" : "mint"}
          emoji={unpaid.length ? "😬" : "😎"}
        />
        <StatCard
          label="Nilai Tunggakan"
          value={rupiah(unpaidTotal)}
          color={unpaidTotal ? "coral" : "mint"}
          emoji="💸"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="!w-auto"
        >
          <option value="semua">Semua Periode</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {fmtPeriod(p)}
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

      {bills.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Zap size={32} />}
            message="Tidak ada tagihan yang cocok dengan filter."
          />
        </Card>
      ) : (
        <>
          {/* Tabel desktop */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-sunny-soft text-left text-xs font-black uppercase tracking-wide">
                  <th className="px-4 py-3">Kamar</th>
                  <th className="px-4 py-3">Penghuni</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3 text-right">Tagihan</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-ink/10 last:border-0"
                  >
                    <td className="px-4 py-3 font-black">{roomNo(b.room_id)}</td>
                    <td className="px-4 py-3">{tenantName(b.tenant_id)}</td>
                    <td className="px-4 py-3">{fmtPeriod(b.period)}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {rupiah(b.amount)}
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {fmtDate(b.due_date)}
                    </td>
                    <td className="px-4 py-3">
                      <BillStatus
                        status={b.status}
                        dueDate={b.due_date}
                        paidDate={b.paid_date}
                        onPay={() => payBill(b.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Kartu mobile */}
          <div className="space-y-2.5 md:hidden">
            {paged.map((b) => (
              <Card key={b.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black">
                      Kamar {roomNo(b.room_id)} · {fmtPeriod(b.period)}
                    </p>
                    <p className="text-xs font-bold text-ink/60">
                      {tenantName(b.tenant_id)}
                    </p>
                  </div>
                  <p className="text-sm font-black">{rupiah(b.amount)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between border-t-2 border-ink/10 pt-2">
                  <p className="text-[11px] font-bold text-ink/50">
                    Jatuh tempo {fmtDate(b.due_date)}
                  </p>
                  <BillStatus
                    status={b.status}
                    dueDate={b.due_date}
                    paidDate={b.paid_date}
                    onPay={() => payBill(b.id)}
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

      {showForm && <BillFormModal open onClose={() => setShowForm(false)} />}
    </>
  );
}

function BillStatus({
  status,
  dueDate,
  paidDate,
  onPay,
}: {
  status: string;
  dueDate: string;
  paidDate: string | null;
  onPay: () => void;
}) {
  if (status === "lunas") {
    return (
      <span title={paidDate ? `Dibayar ${fmtDate(paidDate)}` : undefined}>
        <Badge tone="green">Lunas</Badge>
      </span>
    );
  }
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
