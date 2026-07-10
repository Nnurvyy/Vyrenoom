"use client";

import { useMemo, useState } from "react";
import { Download, FileBarChart2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  currentPeriod,
  daysUntil,
  fmtDate,
  fmtPeriod,
  rupiah,
} from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  StatCard,
} from "@/components/ui";

export default function LaporanPage() {
  const { data } = useStore();
  const [month, setMonth] = useState(currentPeriod()); // yyyy-mm

  const roomNo = (id: number) =>
    data.rooms.find((r) => r.id === id)?.room_number ?? "?";
  const tenantName = (id: number) =>
    data.tenants.find((t) => t.id === id)?.name ?? "-";

  // Pemasukan = pembayaran (listrik & sewa) yang DIBAYAR pada bulan terpilih
  const paidBills = useMemo(
    () =>
      data.bills.filter(
        (b) => b.status === "lunas" && b.paid_date?.startsWith(month)
      ),
    [data.bills, month]
  );
  const paidAnnuals = useMemo(
    () =>
      data.annuals.filter(
        (a) => a.status === "lunas" && a.paid_date?.startsWith(month)
      ),
    [data.annuals, month]
  );
  const electricityIncome = paidBills.reduce((s, b) => s + b.amount, 0);
  const rentIncome = paidAnnuals.reduce((s, a) => s + a.amount, 0);

  // Tunggakan berjalan (semua yang belum dibayar sampai sekarang)
  const arrears = useMemo(() => {
    const list: {
      key: string;
      room: string;
      tenant: string;
      jenis: string;
      periode: string;
      amount: number;
      due: string;
    }[] = [];
    for (const b of data.bills) {
      if (b.status !== "belum_bayar") continue;
      list.push({
        key: `L${b.id}`,
        room: roomNo(b.room_id),
        tenant: tenantName(b.tenant_id),
        jenis: "Listrik",
        periode: fmtPeriod(b.period),
        amount: b.amount,
        due: b.due_date,
      });
    }
    for (const a of data.annuals) {
      if (a.status !== "belum_bayar") continue;
      list.push({
        key: `S${a.id}`,
        room: roomNo(a.room_id),
        tenant: tenantName(a.tenant_id),
        jenis: "Sewa Tahunan",
        periode: a.period,
        amount: a.amount,
        due: a.due_date,
      });
    }
    return list.sort((x, y) => x.due.localeCompare(y.due));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.bills, data.annuals, data.rooms, data.tenants]);

  const arrearsTotal = arrears.reduce((s, x) => s + x.amount, 0);

  function exportCSV() {
    const lines: string[] = [];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    lines.push(
      `Laporan Bulanan ${fmtPeriod(month)} - ${data.settings.kos_name}`
    );
    lines.push("");
    lines.push("PEMASUKAN");
    lines.push(
      ["Jenis", "Kamar", "Penghuni", "Periode", "Tanggal Bayar", "Nominal"]
        .map(esc)
        .join(",")
    );
    for (const b of paidBills)
      lines.push(
        [
          "Listrik",
          roomNo(b.room_id),
          tenantName(b.tenant_id),
          fmtPeriod(b.period),
          b.paid_date ?? "",
          b.amount,
        ]
          .map(esc)
          .join(",")
      );
    for (const a of paidAnnuals)
      lines.push(
        [
          "Sewa Tahunan",
          roomNo(a.room_id),
          tenantName(a.tenant_id),
          a.period,
          a.paid_date ?? "",
          a.amount,
        ]
          .map(esc)
          .join(",")
      );
    lines.push(
      ["TOTAL", "", "", "", "", electricityIncome + rentIncome]
        .map(esc)
        .join(",")
    );
    lines.push("");
    lines.push("TUNGGAKAN");
    lines.push(
      ["Jenis", "Kamar", "Penghuni", "Periode", "Jatuh Tempo", "Nominal"]
        .map(esc)
        .join(",")
    );
    for (const x of arrears)
      lines.push(
        [x.jenis, x.room, x.tenant, x.periode, x.due, x.amount]
          .map(esc)
          .join(",")
      );
    lines.push(["TOTAL", "", "", "", "", arrearsTotal].map(esc).join(","));

    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        emoji="📊"
        title="Laporan Bulanan"
        subtitle="Ringkasan pemasukan & daftar tunggakan"
        action={
          <Button variant="danger" onClick={exportCSV}>
            <Download size={16} /> Ekspor CSV
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="!w-auto"
          aria-label="Pilih bulan laporan"
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard
          label="Pemasukan Listrik"
          value={rupiah(electricityIncome)}
          hint={`${paidBills.length} pembayaran`}
          color="sunny"
          emoji="⚡"
        />
        <StatCard
          label="Pemasukan Sewa"
          value={rupiah(rentIncome)}
          hint={`${paidAnnuals.length} pembayaran`}
          color="grape"
          emoji="🏠"
        />
        <StatCard
          label="Total Pemasukan"
          value={rupiah(electricityIncome + rentIncome)}
          hint={fmtPeriod(month)}
          color="mint"
          emoji="💰"
        />
        <StatCard
          label="Total Tunggakan"
          value={rupiah(arrearsTotal)}
          hint={`${arrears.length} tagihan`}
          color={arrearsTotal ? "coral" : "mint"}
          emoji={arrearsTotal ? "🚨" : "🎉"}
        />
      </div>

      <h2 className="mb-2 text-sm font-black">💰 Pemasukan {fmtPeriod(month)}</h2>
      {paidBills.length + paidAnnuals.length === 0 ? (
        <Card className="mb-6">
          <EmptyState
            icon={<FileBarChart2 size={32} />}
            message="Belum ada pembayaran masuk pada bulan ini."
          />
        </Card>
      ) : (
        <Card className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-mint-soft text-left text-xs font-black uppercase tracking-wide">
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Kamar</th>
                <th className="px-4 py-3">Penghuni</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Dibayar</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {paidBills.map((b) => (
                <tr
                  key={`b${b.id}`}
                  className="border-b border-ink/10 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Badge tone="amber">Listrik</Badge>
                  </td>
                  <td className="px-4 py-3 font-black">{roomNo(b.room_id)}</td>
                  <td className="px-4 py-3">{tenantName(b.tenant_id)}</td>
                  <td className="px-4 py-3">{fmtPeriod(b.period)}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {fmtDate(b.paid_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {rupiah(b.amount)}
                  </td>
                </tr>
              ))}
              {paidAnnuals.map((a) => (
                <tr
                  key={`a${a.id}`}
                  className="border-b border-ink/10 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Badge tone="grape">Sewa</Badge>
                  </td>
                  <td className="px-4 py-3 font-black">{roomNo(a.room_id)}</td>
                  <td className="px-4 py-3">{tenantName(a.tenant_id)}</td>
                  <td className="px-4 py-3">{a.period}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {fmtDate(a.paid_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {rupiah(a.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <h2 className="mb-2 text-sm font-black">🧾 Daftar Tunggakan Berjalan</h2>
      {arrears.length === 0 ? (
        <Card>
          <EmptyState message="Tidak ada tunggakan. Semua pembayaran lunas! 🎉" />
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-coral-soft text-left text-xs font-black uppercase tracking-wide">
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Kamar</th>
                <th className="px-4 py-3">Penghuni</th>
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {arrears.map((x) => (
                <tr key={x.key} className="border-b border-ink/10 last:border-0">
                  <td className="px-4 py-3">
                    <Badge tone={x.jenis === "Listrik" ? "amber" : "grape"}>
                      {x.jenis}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-black">{x.room}</td>
                  <td className="px-4 py-3">{x.tenant}</td>
                  <td className="px-4 py-3">{x.periode}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        daysUntil(x.due) < 0
                          ? "font-bold text-coral"
                          : "text-ink/70"
                      }
                    >
                      {fmtDate(x.due)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {rupiah(x.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
