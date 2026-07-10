"use client";

import { useMemo, useState } from "react";
import { BedDouble, Pencil, Plus, User, Wrench, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { Room, RoomStatus } from "@/lib/types";
import { fmtDate, fmtPeriod, rupiah } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  cx,
} from "@/components/ui";
import { AnnualFormModal, BillFormModal } from "@/components/forms";

type Filter = "semua" | RoomStatus | "menunggak";

const STATUS_LABEL: Record<RoomStatus, string> = {
  kosong: "Kosong",
  terisi: "Terisi",
  perbaikan: "Perbaikan",
};

const TILE_STYLE: Record<RoomStatus, string> = {
  kosong: "bg-card",
  terisi: "bg-mint-soft",
  perbaikan: "bg-sunny-soft",
};

const FILTER_ACTIVE: Record<Filter, string> = {
  semua: "bg-ink text-white",
  terisi: "bg-mint text-ink",
  kosong: "bg-sunny text-ink",
  perbaikan: "bg-peach text-ink",
  menunggak: "bg-coral text-white",
};

export default function PetaKamarPage() {
  const { data, updateRoomStatus, updateRoomRate, payBill, payAnnual } =
    useStore();
  const [filter, setFilter] = useState<Filter>("semua");
  const [selected, setSelected] = useState<Room | null>(null);
  const [billFormRoom, setBillFormRoom] = useState<number | null>(null);
  const [annualFormRoom, setAnnualFormRoom] = useState<number | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editRate, setEditRate] = useState<string | null>(null);

  const arrearsRoomIds = useMemo(() => {
    const ids = new Set<number>();
    data.bills.forEach((b) => b.status === "belum_bayar" && ids.add(b.room_id));
    data.annuals.forEach(
      (a) => a.status === "belum_bayar" && ids.add(a.room_id)
    );
    return ids;
  }, [data.bills, data.annuals]);

  const stats = useMemo(
    () => ({
      total: data.rooms.length,
      terisi: data.rooms.filter((r) => r.status === "terisi").length,
      kosong: data.rooms.filter((r) => r.status === "kosong").length,
      menunggak: data.rooms.filter((r) => arrearsRoomIds.has(r.id)).length,
    }),
    [data.rooms, arrearsRoomIds]
  );

  const floors = useMemo(() => {
    const map = new Map<string, Room[]>();
    for (const r of data.rooms) {
      if (filter === "menunggak" && !arrearsRoomIds.has(r.id)) continue;
      if (filter !== "semua" && filter !== "menunggak" && r.status !== filter)
        continue;
      if (!map.has(r.floor)) map.set(r.floor, []);
      map.get(r.floor)!.push(r);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.rooms, filter, arrearsRoomIds]);

  const filters: { key: Filter; label: string }[] = [
    { key: "semua", label: `Semua (${stats.total})` },
    { key: "terisi", label: `Terisi (${stats.terisi})` },
    { key: "kosong", label: `Kosong (${stats.kosong})` },
    {
      key: "perbaikan",
      label: `Perbaikan (${stats.total - stats.terisi - stats.kosong})`,
    },
    { key: "menunggak", label: `Menunggak (${stats.menunggak})` },
  ];

  // Data kamar terpilih (ambil ulang dari store agar selalu segar)
  const room = selected
    ? (data.rooms.find((r) => r.id === selected.id) ?? null)
    : null;
  const tenant = room
    ? data.tenants.find((t) => t.room_id === room.id && t.status === "aktif")
    : null;
  const roomBills = room
    ? data.bills
        .filter((b) => b.room_id === room.id)
        .sort((a, b) => b.period.localeCompare(a.period))
    : [];
  const roomAnnuals = room
    ? data.annuals
        .filter((a) => a.room_id === room.id)
        .sort((a, b) => b.period.localeCompare(a.period))
    : [];

  return (
    <>
      <PageHeader
        emoji="🗺️"
        title="Peta Kamar"
        subtitle="Pantau status hunian & pembayaran seluruh kamar"
        action={
          <Button variant="sunny" onClick={() => setShowAddRoom(true)}>
            <Plus size={16} /> Tambah Kamar
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-4 sm:gap-3">
        <StatCard label="Total Kamar" value={stats.total} color="sky" emoji="🏠" />
        <StatCard label="Terisi" value={stats.terisi} color="mint" emoji="🙋" />
        <StatCard label="Kosong" value={stats.kosong} color="sunny" emoji="🛏️" />
        <StatCard label="Menunggak" value={stats.menunggak} color="coral" emoji="🚨" />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cx(
              "whitespace-nowrap rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
              filter === f.key
                ? FILTER_ACTIVE[f.key]
                : "bg-card hover:bg-sunny-soft"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {floors.length === 0 && (
        <Card className="p-8 text-center text-sm text-ink/50">
          Tidak ada kamar yang cocok dengan filter. 🙈
        </Card>
      )}

      {floors.map(([floor, rooms]) => (
        <section key={floor} className="mb-6">
          <h2 className="mb-2 inline-block rounded-full border-2 border-ink bg-grape-soft px-3 py-0.5 text-xs font-black uppercase tracking-wide shadow-[2px_2px_0_0_var(--color-ink)]">
            🏢 Lantai {floor}
          </h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
            {rooms.map((r) => {
              const t = data.tenants.find(
                (x) => x.room_id === r.id && x.status === "aktif"
              );
              const arrears = arrearsRoomIds.has(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={cx(
                    "relative rounded-2xl border-2 border-ink p-3 text-left shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-ink)] cursor-pointer",
                    TILE_STYLE[r.status]
                  )}
                >
                  {arrears && (
                    <span
                      title="Ada tunggakan"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-coral text-[10px] font-black text-white"
                    >
                      !
                    </span>
                  )}
                  <p className="text-base font-black">{r.room_number}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[10px] font-bold text-ink/60 sm:text-[11px]">
                    {r.status === "terisi" ? (
                      <>
                        <User size={11} className="shrink-0" />
                        <span className="truncate">{t?.name ?? "Terisi"}</span>
                      </>
                    ) : r.status === "perbaikan" ? (
                      <>
                        <Wrench size={11} className="shrink-0" /> Perbaikan
                      </>
                    ) : (
                      <>
                        <BedDouble size={11} className="shrink-0" /> Kosong
                      </>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Legenda */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border-2 border-ink bg-mint-soft" />
          Terisi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border-2 border-ink bg-card" />
          Kosong
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border-2 border-ink bg-sunny-soft" />
          Perbaikan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-ink bg-coral text-[9px] font-black text-white">
            !
          </span>
          Ada tunggakan
        </span>
      </div>

      {/* Detail kamar */}
      <Modal
        open={!!room}
        onClose={() => {
          setSelected(null);
          setEditRate(null);
        }}
        title={room ? `🚪 Kamar ${room.room_number} — Lantai ${room.floor}` : ""}
      >
        {room && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                tone={
                  room.status === "terisi"
                    ? "green"
                    : room.status === "perbaikan"
                      ? "amber"
                      : "gray"
                }
              >
                {STATUS_LABEL[room.status]}
              </Badge>
              <Select
                value={room.status}
                onChange={(e) =>
                  updateRoomStatus(room.id, e.target.value as RoomStatus)
                }
                className="!w-auto text-xs"
                disabled={!!tenant && room.status === "terisi"}
              >
                <option value="kosong">Kosong</option>
                <option value="terisi">Terisi</option>
                <option value="perbaikan">Perbaikan</option>
              </Select>
            </div>

            {/* Harga sewa kamar ini */}
            <div className="rounded-xl border-2 border-ink bg-grape-soft px-3 py-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-ink/60">
                Harga Sewa Kamar Ini
              </p>
              {editRate === null ? (
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="text-sm font-black">
                    {rupiah(room.annual_rate)}/tahun
                  </p>
                  <button
                    onClick={() => setEditRate(String(room.annual_rate))}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    <Pencil size={11} /> Ubah
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="!py-1 text-xs"
                  />
                  <Button
                    variant="mint"
                    className="!px-2.5 !py-1 text-[11px]"
                    onClick={async () => {
                      await updateRoomRate(room.id, Number(editRate) || 0);
                      setEditRate(null);
                    }}
                  >
                    Simpan
                  </Button>
                </div>
              )}
            </div>

            {tenant ? (
              <div className="rounded-xl border-2 border-ink bg-mint-soft p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-ink/60">
                  Penghuni Aktif
                </p>
                <p className="mt-1 text-sm font-black">{tenant.name}</p>
                <p className="text-xs font-bold text-ink/60">{tenant.phone}</p>
                <p className="mt-1 text-xs text-ink/60">
                  Masa sewa: {fmtDate(tenant.start_date)} —{" "}
                  {fmtDate(tenant.end_date)}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-ink/40 p-3 text-xs text-ink/50">
                Belum ada penghuni aktif di kamar ini.
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-ink/60">
                ⚡ Tagihan Listrik Terakhir
              </p>
              {roomBills.length === 0 ? (
                <p className="text-xs text-ink/50">Belum ada tagihan.</p>
              ) : (
                <div className="space-y-2">
                  {roomBills.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-black">
                          {fmtPeriod(b.period)}
                        </p>
                        <p className="text-[11px] font-bold text-ink/60">
                          {rupiah(b.amount)} · jatuh tempo {fmtDate(b.due_date)}
                        </p>
                      </div>
                      {b.status === "lunas" ? (
                        <Badge tone="green">Lunas</Badge>
                      ) : (
                        <Button
                          variant="mint"
                          className="!px-2 !py-1 text-[11px]"
                          onClick={() => payBill(b.id)}
                        >
                          Tandai Lunas
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-ink/60">
                📅 Sewa Tahunan
              </p>
              {roomAnnuals.length === 0 ? (
                <p className="text-xs text-ink/50">
                  Belum ada catatan sewa tahunan.
                </p>
              ) : (
                <div className="space-y-2">
                  {roomAnnuals.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-black">
                          Periode {a.period}
                        </p>
                        <p className="text-[11px] font-bold text-ink/60">
                          {rupiah(a.amount)} · jatuh tempo {fmtDate(a.due_date)}
                        </p>
                      </div>
                      {a.status === "lunas" ? (
                        <Badge tone="green">Lunas</Badge>
                      ) : (
                        <Button
                          variant="mint"
                          className="!px-2 !py-1 text-[11px]"
                          onClick={() => payAnnual(a.id)}
                        >
                          Tandai Lunas
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {tenant && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="sunny" onClick={() => setBillFormRoom(room.id)}>
                  <Zap size={15} /> Catat Listrik
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setAnnualFormRoom(room.id)}
                >
                  <Plus size={15} /> Catat Sewa
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {billFormRoom !== null && (
        <BillFormModal
          open
          onClose={() => setBillFormRoom(null)}
          defaultRoomId={billFormRoom}
        />
      )}
      {annualFormRoom !== null && (
        <AnnualFormModal
          open
          onClose={() => setAnnualFormRoom(null)}
          defaultRoomId={annualFormRoom}
        />
      )}

      <AddRoomModal open={showAddRoom} onClose={() => setShowAddRoom(false)} />
    </>
  );
}

function AddRoomModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addRoom } = useStore();
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("1");
  const [rate, setRate] = useState("12000000");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const err = await addRoom(
      number.trim(),
      floor.trim() || "1",
      Number(rate) || 12000000
    );
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setNumber("");
    setRate("12000000");
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="➕ Tambah Kamar">
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field label="Nomor Kamar" hint="Contoh: A7, B3, C1">
          <Input
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </Field>
        <Field label="Lantai">
          <Input
            required
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          />
        </Field>
        <Field
          label="Harga Sewa Tahunan (Rp)"
          hint="Boleh beda tiap kamar — default Rp12.000.000"
        >
          <Input
            type="number"
            required
            min={0}
            inputMode="numeric"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
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
