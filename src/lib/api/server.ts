import { apiEndpoint } from "@/config/env";
import { readSessionCookies } from "@/lib/auth/session";

import { toApiError, ApiError } from "./errors";
import type { QueryParams } from "./types";

/**
 * Cliente para Server Components.
 *
 * Va directo a FastAPI (no pasa por el proxy) porque ya esta en el servidor y
 * puede leer las cookies httpOnly. Un Server Component no puede escribir
 * cookies, asi que aqui NO se refresca el token: si vence, el layout redirige
 * a `/api/auth/refresh`, que si puede hacerlo.
 */
export async function serverApi<T>(
  path: string,
  options: { params?: QueryParams; method?: string; body?: unknown } = {},
): Promise<T> {
  const { accessToken, companyId } = await readSessionCookies();

  const url = new URL(apiEndpoint(path));
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.append(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(companyId ? { "X-Company-ID": companyId } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Sin conexion con el servidor");
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
