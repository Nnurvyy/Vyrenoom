import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/server/session";
import { loadAppData } from "@/server/data";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return NextResponse.json({
    user: { name: user.name, email: user.email },
    data: loadAppData(user.id),
  });
}
