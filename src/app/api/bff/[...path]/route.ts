import { NextResponse, type NextRequest } from "next/server";

import { apiEndpoint } from "@/config/env";
import {
  clearSessionCookies,
  exchangeRefreshToken,
  readSessionCookies,
  writeTokenCookies,
} from "@/lib/auth/session";

/**
 * Proxy entre el navegador y FastAPI.
 *
 * Anade `Authorization` y `X-Company-ID` desde cookies httpOnly, y reintenta
 * una sola vez con un token nuevo cuando el backend responde 401. El navegador
 * nunca ve los tokens ni la URL real de la API.
 */

/**
 * Estos endpoints devuelven tokens en el cuerpo. Si se pudieran alcanzar por
 * el proxy, el token acabaria en JavaScript y las cookies httpOnly no servirian
 * de nada. Tienen su propio Route Handler que si guarda las cookies.
 */
const BLOCKED = new Set(["auth/login", "auth/register", "auth/refresh"]);

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, details: {} } }, { status });
}

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const route = path.join("/");

  if (BLOCKED.has(route)) {
    return jsonError(404, "RESOURCE_NOT_FOUND", "Ruta no disponible a traves del proxy");
  }

  const { accessToken, refreshToken, companyId } = await readSessionCookies();
  if (!accessToken && !refreshToken) {
    return jsonError(401, "UNAUTHORIZED", "No hay sesion activa");
  }

  const target = `${apiEndpoint(`/${route}`)}${request.nextUrl.search}`;
  const body = METHODS_WITH_BODY.has(request.method) ? await request.text() : undefined;

  const call = (token: string | null) =>
    fetch(target, {
      method: request.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(companyId ? { "X-Company-ID": companyId } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body || undefined,
      cache: "no-store",
    });

  let upstream: Response;
  try {
    upstream = await call(accessToken);
  } catch {
    return jsonError(502, "NETWORK_ERROR", "No pudimos conectar con la API");
  }

  if (upstream.status === 401 && refreshToken) {
    const tokens = await exchangeRefreshToken(refreshToken);
    if (!tokens) {
      await clearSessionCookies();
      return jsonError(401, "UNAUTHORIZED", "Tu sesion expiro");
    }
    await writeTokenCookies(tokens);
    try {
      upstream = await call(tokens.access_token);
    } catch {
      return jsonError(502, "NETWORK_ERROR", "No pudimos conectar con la API");
    }
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
