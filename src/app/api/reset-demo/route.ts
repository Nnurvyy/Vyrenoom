import { NextResponse } from "next/server";
import { getDb, resetUserData } from "@/server/db";
import { getSessionUser, unauthorized } from "@/server/session";

/** Kembalikan data akun ini ke data contoh awal. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  resetUserData(getDb(), user.id);
  return NextResponse.json({ ok: true });
}
