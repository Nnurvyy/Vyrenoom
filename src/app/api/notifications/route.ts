import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

/** Tandai dibaca: { id } untuk satu, { all: true } untuk semua. */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const b = await req.json();

  const db = getDb();
  if (b.all) {
    db.prepare(
      "UPDATE notifications SET status = 'read' WHERE user_id = ?"
    ).run(user.id);
  } else if (b.id) {
    const r = db
      .prepare(
        "UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ?"
      )
      .run(Number(b.id), user.id);
    if (r.changes === 0) return badRequest("Notifikasi tidak ditemukan.");
  } else {
    return badRequest("Permintaan tidak valid.");
  }
  return NextResponse.json({ ok: true });
}
