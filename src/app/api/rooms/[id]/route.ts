import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const roomId = Number(id);
  const body = await req.json();

  const db = getDb();
  const room = db
    .prepare("SELECT id, status FROM rooms WHERE id = ? AND user_id = ?")
    .get(roomId, user.id) as { id: number; status: string } | undefined;
  if (!room) return badRequest("Kamar tidak ditemukan.");

  if (body.status !== undefined) {
    if (!["kosong", "terisi", "perbaikan"].includes(body.status))
      return badRequest("Status tidak valid.");
    db.prepare(
      "UPDATE rooms SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(body.status, roomId);
  }
  if (body.annual_rate !== undefined) {
    const rate = Number(body.annual_rate);
    if (!(rate >= 0)) return badRequest("Harga sewa tidak valid.");
    db.prepare(
      "UPDATE rooms SET annual_rate = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(rate, roomId);
  }
  return NextResponse.json({ ok: true });
}
