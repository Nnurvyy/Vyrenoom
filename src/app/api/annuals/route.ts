import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const b = await req.json();
  const roomId = Number(b.room_id);
  if (!roomId) return badRequest("Kamar wajib dipilih.");
  if (!/^\d{4}-\d{4}$/.test(b.period ?? ""))
    return badRequest("Periode sewa tidak valid (contoh: 2025-2026).");
  const amount = Number(b.amount);
  if (!(amount > 0)) return badRequest("Nominal sewa tidak valid.");
  if (!b.due_date) return badRequest("Tanggal jatuh tempo wajib diisi.");

  const db = getDb();
  const tenant = db
    .prepare(
      "SELECT id FROM tenants WHERE user_id = ? AND room_id = ? AND status = 'aktif'"
    )
    .get(user.id, roomId) as { id: number } | undefined;
  if (!tenant) return badRequest("Kamar ini tidak memiliki penghuni aktif.");

  const dup = db
    .prepare(
      "SELECT id FROM annual_payments WHERE user_id = ? AND room_id = ? AND period = ?"
    )
    .get(user.id, roomId, b.period);
  if (dup) return badRequest("Catatan sewa untuk kamar & periode ini sudah ada.");

  db.prepare(
    `INSERT INTO annual_payments (user_id, room_id, tenant_id, period, amount, status, due_date, paid_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    user.id,
    roomId,
    tenant.id,
    b.period,
    amount,
    b.paid ? "lunas" : "belum_bayar",
    b.due_date,
    b.paid ? new Date().toISOString().slice(0, 10) : null
  );
  return NextResponse.json({ ok: true });
}
