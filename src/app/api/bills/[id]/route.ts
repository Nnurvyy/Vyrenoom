import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { badRequest, getSessionUser, unauthorized } from "@/server/session";

/** Tandai lunas. */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const result = getDb()
    .prepare(
      `UPDATE electricity_bills SET status = 'lunas', paid_date = ?
       WHERE id = ? AND user_id = ? AND status = 'belum_bayar'`
    )
    .run(new Date().toISOString().slice(0, 10), Number(id), user.id);
  if (result.changes === 0)
    return badRequest("Tagihan tidak ditemukan atau sudah lunas.");
  return NextResponse.json({ ok: true });
}
