"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserX, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { Tenant } from "@/lib/types";
import { fmtDate, todayStr } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  Field,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  cx,
  usePagination,
} from "@/components/ui";

export default function PenghuniPage() {
  const { data, deactivateTenant, deleteTenant } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);

  const roomNo = (id: number | null) =>
    id ? (data.rooms.find((r) => r.id === id)?.room_number ?? "-") : "-";

  const tenants = useMemo(
    () =>
      data.tenants
        .filter((t) => (showInactive ? true : t.status === "aktif"))
        .filter((t) =>
          query
            ? t.name.toLowerCase().includes(query.toLowerCase()) ||
              roomNo(t.room_id).toLowerCase().includes(query.toLowerCase())
            : true
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.tenants, data.rooms, query, showInactive]
  );

  const { paged, page, totalPages, setPage, total } = usePagination(tenants);

  return (
    <>
      <PageHeader
        emoji="👥"
        title="Data Penghuni"
        subtitle={`${data.tenants.filter((t) => t.status === "aktif").length} penghuni aktif`}
        action={
          <Button
            variant="mint"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus size={16} /> Tambah Penghuni
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Penghuni Aktif"
          value={data.tenants.filter((t) => t.status === "aktif").length}
          color="mint"
          emoji="🙋"
        />
        <StatCard
          label="Sudah Keluar"
          value={data.tenants.filter((t) => t.status === "nonaktif").length}
          color="grape"
          emoji="👋"
        />
        <StatCard
          label="Kamar Kosong"
          value={data.rooms.filter((r) => r.status === "kosong").length}
          color="sunny"
          emoji="🛏️"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama / kamar… 🔍"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={cx(
            "rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold cursor-pointer",
            showInactive ? "bg-ink text-white" : "bg-card hover:bg-sunny"
          )}
        >
          Tampilkan nonaktif
        </button>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={32} />}
            message="Belum ada data penghuni."
          />
        </Card>
      ) : (
        <>
          {/* Tabel desktop */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-mint-soft text-left text-xs font-black uppercase tracking-wide">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Kamar</th>
                  <th className="px-4 py-3">Telepon</th>
                  <th className="px-4 py-3">Masa Sewa</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-ink/10 last:border-0"
                  >
                    <td className="px-4 py-3 font-bold">{t.name}</td>
                    <td className="px-4 py-3">{roomNo(t.room_id)}</td>
                    <td className="px-4 py-3 text-ink/70">{t.phone}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {fmtDate(t.start_date)} — {fmtDate(t.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={t.status === "aktif" ? "green" : "gray"}>
                        {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <TenantActions
                        tenant={t}
                        onEdit={() => {
                          setEditing(t);
                          setShowForm(true);
                        }}
                        onDeactivate={() => deactivateTenant(t.id)}
                        onDelete={() => setConfirmDelete(t)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Kartu mobile */}
          <div className="space-y-2.5 md:hidden">
            {paged.map((t) => (
              <Card key={t.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{t.name}</p>
                    <p className="text-xs font-bold text-ink/60">
                      Kamar {roomNo(t.room_id)} · {t.phone}
                    </p>
                    <p className="mt-1 text-[11px] text-ink/50">
                      {fmtDate(t.start_date)} — {fmtDate(t.end_date)}
                    </p>
                  </div>
                  <Badge tone={t.status === "aktif" ? "green" : "gray"}>
                    {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <div className="mt-2 flex justify-end border-t-2 border-ink/10 pt-2">
                  <TenantActions
                    tenant={t}
                    onEdit={() => {
                      setEditing(t);
                      setShowForm(true);
                    }}
                    onDeactivate={() => deactivateTenant(t.id)}
                    onDelete={() => setConfirmDelete(t)}
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

      {showForm && (
        <TenantFormModal
          open
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          editing={editing}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="🗑️ Hapus Penghuni"
      >
        <p className="text-sm">
          Hapus permanen data <b>{confirmDelete?.name}</b> beserta seluruh
          riwayat pembayarannya? Tindakan ini tidak bisa dikembalikan.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmDelete(null)}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              if (confirmDelete) await deleteTenant(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </>
  );
}

function TenantActions({
  tenant,
  onEdit,
  onDeactivate,
  onDelete,
}: {
  tenant: Tenant;
  onEdit: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={onEdit}
        title="Ubah"
        className="rounded-lg border-2 border-ink bg-sky-soft p-1.5 hover:bg-sky hover:text-white cursor-pointer"
      >
        <Pencil size={14} />
      </button>
      {tenant.status === "aktif" && (
        <button
          onClick={onDeactivate}
          title="Nonaktifkan (penghuni keluar)"
          className="rounded-lg border-2 border-ink bg-sunny-soft p-1.5 hover:bg-sunny cursor-pointer"
        >
          <UserX size={14} />
        </button>
      )}
      <button
        onClick={onDelete}
        title="Hapus permanen"
        className="rounded-lg border-2 border-ink bg-coral-soft p-1.5 hover:bg-coral hover:text-white cursor-pointer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function TenantFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Tenant | null;
}) {
  const { data, addTenant, updateTenant } = useStore();
  const [name, setName] = useState(editing?.name ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [idCard, setIdCard] = useState(editing?.id_card_number ?? "");
  const [roomId, setRoomId] = useState<number | "">(editing?.room_id ?? "");
  const [startDate, setStartDate] = useState(editing?.start_date ?? todayStr());
  const [endDate, setEndDate] = useState(editing?.end_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Kamar yang bisa dipilih: kosong, atau kamar penghuni ini sendiri
  const selectableRooms = data.rooms.filter(
    (r) =>
      r.id === editing?.room_id ||
      (r.status !== "perbaikan" &&
        !data.tenants.some((t) => t.room_id === r.id && t.status === "aktif"))
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!endDate) {
      setError("Tanggal akhir sewa wajib diisi.");
      return;
    }
    if (endDate <= startDate) {
      setError("Tanggal akhir harus setelah tanggal mulai.");
      return;
    }
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      id_card_number: idCard.trim(),
      room_id: roomId === "" ? null : Number(roomId),
      start_date: startDate,
      end_date: endDate,
    };
    setSaving(true);
    const err = editing
      ? await updateTenant({ ...payload, id: editing.id, status: editing.status })
      : await addTenant(payload);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "✏️ Ubah Penghuni" : "➕ Tambah Penghuni"}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorText>{error}</ErrorText>
        <Field label="Nama Lengkap">
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="No. Telepon">
            <Input
              required
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="No. KTP">
            <Input
              value={idCard}
              inputMode="numeric"
              onChange={(e) => setIdCard(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Kamar" hint="Hanya kamar kosong yang bisa dipilih">
          <Select
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">— Belum ditautkan —</option>
            {selectableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                Kamar {r.room_number} (Lantai {r.floor})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mulai Sewa">
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Akhir Sewa">
            <Input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
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
            {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
