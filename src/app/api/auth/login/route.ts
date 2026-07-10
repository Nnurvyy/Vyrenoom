import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { verifyPassword } from "@/server/auth-crypto";
import { badRequest, createSession } from "@/server/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email?.trim() || !password)
    return badRequest("Email dan kata sandi wajib diisi.");

  const db = getDb();
  const user = db
    .prepare(
      "SELECT id, password_hash FROM users WHERE lower(email) = lower(?)"
    )
    .get(email.trim()) as { id: number; password_hash: string } | undefined;
  if (!user) return badRequest("Email tidak terdaftar.");
  if (!verifyPassword(password, user.password_hash))
    return badRequest("Kata sandi salah.");

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
