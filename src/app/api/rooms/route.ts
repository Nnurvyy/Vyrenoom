import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { room_number, floor, annual_rate } = await req.json();
  if (!room_number?.trim()) return badRequest("Nomor kamar wajib diisi.");

  const db = getDb();
  const dup = db
    .prepare(
      "SELECT id FROM rooms WHERE user_id = ? AND lower(room_number) = lower(?)"
    )
    .get(user.id, room_number.trim());
  if (dup) return badRequest("Nomor kamar sudah dipakai.");

  db.prepare(
    "INSERT INTO rooms (user_id, room_number, floor, annual_rate) VALUES (?, ?, ?, ?)"
  ).run(
    user.id,
    room_number.trim(),
    String(floor ?? "1").trim() || "1",
    Number(annual_rate) > 0 ? Number(annual_rate) : 12000000
  );
  return NextResponse.json({ ok: true });
}
