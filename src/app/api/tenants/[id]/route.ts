import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

interface TenantRow {
  id: number;
  room_id: number | null;
  status: string;
}

function getTenant(userId: number, id: number): TenantRow | undefined {
  return getDb()
    .prepare(
      "SELECT id, room_id, status FROM tenants WHERE id = ? AND user_id = ?"
    )
    .get(id, userId) as TenantRow | undefined;
}

/** Update data penghuni (termasuk pindah kamar). */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tenantId = Number(id);
  const b = await req.json();

  const db = getDb();
  const old = getTenant(user.id, tenantId);
  if (!old) return badRequest("Penghuni tidak ditemukan.");
  if (!b.name?.trim()) return badRequest("Nama wajib diisi.");
  if (b.end_date <= b.start_date)
    return badRequest("Tanggal akhir harus setelah tanggal mulai.");

  const newRoomId = b.room_id ? Number(b.room_id) : null;
  if (newRoomId && newRoomId !== old.room_id) {
    const occupied = db
      .prepare(
        "SELECT id FROM tenants WHERE user_id = ? AND room_id = ? AND status = 'aktif' AND id != ?"
      )
      .get(user.id, newRoomId, tenantId);
    if (occupied) return badRequest("Kamar tujuan sudah ada penghuni aktif.");
  }

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE tenants SET room_id = ?, name = ?, phone = ?, id_card_number = ?,
       start_date = ?, end_date = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(
      newRoomId,
      b.name.trim(),
      String(b.phone ?? "").trim(),
      String(b.id_card_number ?? "").trim(),
      b.start_date,
      b.end_date,
      tenantId,
      user.id
    );
    // Kamar lama dikosongkan bila pindah
    if (old.room_id && old.room_id !== newRoomId) {
      db.prepare(
        "UPDATE rooms SET status = 'kosong', updated_at = datetime('now') WHERE id = ? AND user_id = ?"
      ).run(old.room_id, user.id);
    }
    if (newRoomId && old.status === "aktif") {
      db.prepare(
        "UPDATE rooms SET status = 'terisi', updated_at = datetime('now') WHERE id = ? AND user_id = ?"
      ).run(newRoomId, user.id);
    }
  });
  tx();
  return NextResponse.json({ ok: true });
}

/** Nonaktifkan penghuni (keluar dari kos). */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tenantId = Number(id);

  const db = getDb();
  const old = getTenant(user.id, tenantId);
  if (!old) return badRequest("Penghuni tidak ditemukan.");

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE tenants SET status = 'nonaktif', room_id = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
    ).run(tenantId, user.id);
    if (old.room_id) {
      db.prepare(
        "UPDATE rooms SET status = 'kosong', updated_at = datetime('now') WHERE id = ? AND user_id = ?"
      ).run(old.room_id, user.id);
    }
  });
  tx();
  return NextResponse.json({ ok: true });
}

/** Hapus permanen. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tenantId = Number(id);

  const db = getDb();
  const old = getTenant(user.id, tenantId);
  if (!old) return badRequest("Penghuni tidak ditemukan.");

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM tenants WHERE id = ? AND user_id = ?").run(
      tenantId,
      user.id
    );
    if (old.room_id && old.status === "aktif") {
      db.prepare(
        "UPDATE rooms SET status = 'kosong', updated_at = datetime('now') WHERE id = ? AND user_id = ?"
      ).run(old.room_id, user.id);
    }
  });
  tx();
  return NextResponse.json({ ok: true });
}
