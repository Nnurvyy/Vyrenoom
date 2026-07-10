import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { kos_name, address, electricity_rate, annual_rent_rate } =
    await req.json();
  if (!kos_name?.trim()) return badRequest("Nama kos wajib diisi.");

  getDb()
    .prepare(
      `INSERT INTO settings (user_id, kos_name, address, electricity_rate, annual_rent_rate, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         kos_name = excluded.kos_name,
         address = excluded.address,
         electricity_rate = excluded.electricity_rate,
         annual_rent_rate = excluded.annual_rent_rate,
         updated_at = datetime('now')`
    )
    .run(
      user.id,
      kos_name.trim(),
      String(address ?? "").trim(),
      Number(electricity_rate) || 0,
      Number(annual_rent_rate) || 0
    );
  return NextResponse.json({ ok: true });
}
