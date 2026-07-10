import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "./db";
import { newSessionToken } from "./auth-crypto";

const COOKIE_NAME = "pk_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

export async function createSession(userId: number): Promise<void> {
  const db = getDb();
  const token = newSessionToken();
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(
    token,
    userId
  );
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  jar.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name FROM sessions s
       JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token) as SessionUser | undefined;
  return row ?? null;
}

/** Balasan 401 seragam untuk route yang butuh login. */
export function unauthorized() {
  return NextResponse.json({ error: "Belum login." }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
