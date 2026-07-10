"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { rupiah, todayStr } from "@/lib/format";
import { Button, ErrorText, Field, Input, Modal, Select } from "./ui";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function useOccupiedRooms() {
  const { data } = useStore();
  return useMemo(
    () =>
      data.rooms.filter((r) =>
        data.tenants.some((t) => t.room_id === r.id && t.status === "aktif")
      ),
    [data.rooms, data.tenants]
  );
}

/** Form catat tagihan listrik — tarif tetap per bulan, pilih bulan & tahun. */
export function BillFormModal({
  open,
  onClose,
  defaultRoomId,
}: {
  open: boolean;
  onClose: () => void;
  defaultRoomId?: number;
}) {
  const { data, addBill } = useStore();
  const occupiedRooms = useOccupiedRooms();
  const now = new Date();

  const [roomId, setRoomId] = useState<number>(defaultRoomId ?? 0);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState(String(data.settings.electricity_rate));
  const [dueDate, setDueDate] = useState(todayStr());
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await addBill({
      room_id: roomId || defaultRoomId || 0,
      period: `${year}-${String(month).padStart(2, "0")}`,
      amount: Number(amount),
      due_date: dueDate,
      paid,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="⚡ Catat Tagihan Listrik">
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field label="Kamar">
          <Select
            required
            value={roomId || defaultRoomId || ""}
            onChange={(e) => setRoomId(Number(e.target.value))}
          >
            <option value="" disabled>
              Pilih kamar…
            </option>
            {occupiedRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Kamar {r.room_number} (Lantai {r.floor})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bulan">
            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tahun">
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Nominal (Rp)"
          hint={`Tarif tetap per bulan di Pengaturan: ${rupiah(data.settings.electricity_rate)}`}
        >
          <Input
            type="number"
            required
            min={1}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Jatuh Tempo">
          <Input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-4 w-4 accent-[#4d96ff]"
          />
          Sudah dibayar (langsung tandai lunas)
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Tagihan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Form catat sewa tahunan — pilih periode tahun (mis. 2025-2026), harga per kamar. */
export function AnnualFormModal({
  open,
  onClose,
  defaultRoomId,
}: {
  open: boolean;
  onClose: () => void;
  defaultRoomId?: number;
}) {
  const { data, addAnnual } = useStore();
  const occupiedRooms = useOccupiedRooms();
  const thisYear = new Date().getFullYear();

  const [roomId, setRoomId] = useState<number>(defaultRoomId ?? 0);
  const [startYear, setStartYear] = useState(thisYear);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [paid, setPaid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveRoomId = roomId || defaultRoomId || 0;
  const room = data.rooms.find((r) => r.id === effectiveRoomId);

  // Nominal default mengikuti harga sewa kamar terpilih
  useEffect(() => {
    if (room) setAmount(String(room.annual_rate));
  }, [room]);

  const yearOptions = Array.from({ length: 7 }, (_, i) => thisYear - 4 + i);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await addAnnual({
      room_id: effectiveRoomId,
      period: `${startYear}-${startYear + 1}`,
      amount: Number(amount),
      due_date: dueDate,
      paid,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="📅 Catat Sewa Tahunan">
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field label="Kamar">
          <Select
            required
            value={effectiveRoomId || ""}
            onChange={(e) => setRoomId(Number(e.target.value))}
          >
            <option value="" disabled>
              Pilih kamar…
            </option>
            {occupiedRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Kamar {r.room_number} (Lantai {r.floor}) —{" "}
                {rupiah(r.annual_rate)}/th
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Periode Sewa">
          <Select
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}-{y + 1}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Nominal (Rp)"
          hint={
            room
              ? `Harga sewa kamar ${room.room_number}: ${rupiah(room.annual_rate)}/tahun`
              : undefined
          }
        >
          <Input
            type="number"
            required
            min={1}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Jatuh Tempo">
          <Input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-4 w-4 accent-[#4d96ff]"
          />
          Sudah dibayar (tandai lunas hari ini)
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
