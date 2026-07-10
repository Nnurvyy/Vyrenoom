import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const b = await req.json();
  if (!b.name?.trim()) return badRequest("Nama wajib diisi.");
  if (!b.start_date || !b.end_date)
    return badRequest("Tanggal mulai & akhir sewa wajib diisi.");
  if (b.end_date <= b.start_date)
    return badRequest("Tanggal akhir harus setelah tanggal mulai.");

  const db = getDb();
  const roomId = b.room_id ? Number(b.room_id) : null;
  if (roomId) {
    const occupied = db
      .prepare(
        "SELECT id FROM tenants WHERE user_id = ? AND room_id = ? AND status = 'aktif'"
      )
      .get(user.id, roomId);
    if (occupied) return badRequest("Kamar tersebut sudah ada penghuni aktif.");
  }

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO tenants (user_id, room_id, name, phone, id_card_number, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')`
    ).run(
      user.id,
      roomId,
      b.name.trim(),
      String(b.phone ?? "").trim(),
      String(b.id_card_number ?? "").trim(),
      b.start_date,
      b.end_date
    );
    if (roomId) {
      db.prepare(
        "UPDATE rooms SET status = 'terisi', updated_at = datetime('now') WHERE id = ? AND user_id = ?"
      ).run(roomId, user.id);
    }
  });
  tx();
  return NextResponse.json({ ok: true });
}
