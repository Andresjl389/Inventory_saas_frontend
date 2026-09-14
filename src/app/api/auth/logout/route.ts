import { NextResponse } from "next/server";

import { apiEndpoint } from "@/config/env";
import { clearSessionCookies, readSessionCookies } from "@/lib/auth/session";

export async function POST() {
  const { accessToken } = await readSessionCookies();

  // Best effort: el backend es stateless, lo que importa es borrar las cookies.
  if (accessToken) {
    await fetch(apiEndpoint("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }).catch(() => null);
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
