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

  /*
   * El cuerpo se reenvia en binario, no como texto: por aqui pasan tanto JSON
   * como subidas multipart, y convertir bytes a cadena corrompe un archivo.
   * `arrayBuffer` devuelve una copia, asi que se puede reenviar otra vez si
   * hay que reintentar con un token nuevo.
   */
  const body = METHODS_WITH_BODY.has(request.method)
    ? await request.arrayBuffer()
    : undefined;
  const contentType = request.headers.get("content-type");

  const call = (token: string | null) =>
    fetch(target, {
      method: request.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(companyId ? { "X-Company-ID": companyId } : {}),
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body: body && body.byteLength > 0 ? body : undefined,
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

  // Tambien binaria: por aqui vuelven las descargas de archivos e imagenes.
  const payload = await upstream.arrayBuffer();
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    "Cache-Control": "no-store",
  });
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("Content-Disposition", disposition);
  // Va a los logs del backend: sirve para rastrear un fallo concreto.
  const requestId = upstream.headers.get("x-request-id");
  if (requestId) headers.set("X-Request-ID", requestId);

  return new NextResponse(payload, { status: upstream.status, headers });
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
