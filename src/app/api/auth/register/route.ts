import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { hashPassword } from "@/server/auth-crypto";
import { badRequest, createSession } from "@/server/session";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !password)
    return badRequest("Nama, email, dan kata sandi wajib diisi.");
  if (String(password).length < 6)
    return badRequest("Kata sandi minimal 6 karakter.");

  const db = getDb();
  const exists = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(email.trim());
  if (exists) return badRequest("Email sudah terdaftar.");

  const info = db
    .prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)")
    .run(email.trim(), hashPassword(password), name.trim());
  const userId = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO settings (user_id) VALUES (?)").run(userId);

  await createSession(userId);
  return NextResponse.json({ ok: true });
}
