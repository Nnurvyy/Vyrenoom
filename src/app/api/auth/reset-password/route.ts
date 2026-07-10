import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { hashPassword } from "@/server/auth-crypto";
import { badRequest } from "@/server/session";

// Demo: atur ulang langsung tanpa verifikasi email.
export async function POST(req: NextRequest) {
  const { email, newPassword } = await req.json();
  if (!email?.trim() || !newPassword)
    return badRequest("Email dan kata sandi baru wajib diisi.");
  if (String(newPassword).length < 6)
    return badRequest("Kata sandi baru minimal 6 karakter.");

  const db = getDb();
  const user = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(email.trim()) as { id: number } | undefined;
  if (!user) return badRequest("Email tidak terdaftar.");

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hashPassword(newPassword),
    user.id
  );
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  return NextResponse.json({ ok: true });
}
