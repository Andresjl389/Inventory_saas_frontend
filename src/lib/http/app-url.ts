import type { NextRequest } from "next/server";

/**
 * Construye URLs absolutas para redirecciones del frontend.
 *
 * Detras de un reverse proxy, `request.url` puede contener el host interno si
 * el proxy o Next no reconstruyen correctamente los headers reenviados. En
 * produccion usamos APP_URL como fuente canonica para que un refresh de sesion
 * nunca exponga localhost/127.0.0.1 al navegador.
 */
export function appUrl(path: string, request: NextRequest): URL {
  const configuredOrigin = process.env.APP_URL?.trim();
  return new URL(path, configuredOrigin || request.nextUrl.origin);
}
