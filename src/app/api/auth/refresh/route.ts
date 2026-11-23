import { NextResponse, type NextRequest } from "next/server";

import {
  clearSessionCookies,
  exchangeRefreshToken,
  readSessionCookies,
  writeTokenCookies,
} from "@/lib/auth/session";
import { appUrl } from "@/lib/http/app-url";

/**
 * Puente para los Server Components: ellos no pueden escribir cookies, asi que
 * cuando el access token vence redirigen aqui con `?next=...`, se renuevan los
 * tokens y se vuelve a la misma pagina.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  // Solo rutas internas: evita redirecciones abiertas hacia otro dominio.
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  const { refreshToken } = await readSessionCookies();
  if (!refreshToken) {
    await clearSessionCookies();
    return NextResponse.redirect(appUrl("/login", request));
  }

  const tokens = await exchangeRefreshToken(refreshToken);
  if (!tokens) {
    await clearSessionCookies();
    return NextResponse.redirect(appUrl("/login", request));
  }

  await writeTokenCookies(tokens);
  return NextResponse.redirect(appUrl(next, request));
}
