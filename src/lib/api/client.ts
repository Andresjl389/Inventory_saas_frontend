import { appConfig } from "@/config/env";
import { toApiError, ApiError } from "./errors";
import type { QueryParams } from "./types";

/**
 * Cliente HTTP del navegador.
 *
 * Nunca apunta a FastAPI: habla con los Route Handlers de Next. Son ellos los
 * que adjuntan el `Authorization` y el `X-Company-ID` leyendo cookies
 * httpOnly, asi que el token jamas llega a JavaScript. Al ser mismo origen no
 * hace falta `credentials`.
 *
 * Ninguna feature debe llamar a `fetch` directamente: todas pasan por aqui.
 */

type RequestOptions = {
  params?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

function buildUrl(base: string, path: string, params?: QueryParams): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${clean}`;
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

function createClient(base: string) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(buildUrl(base, path, options.params), {
        method,
        signal: options.signal,
        headers: {
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...options.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw new ApiError(0, "NETWORK_ERROR", "Sin conexion con el servidor");
    }

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /**
   * Subida de archivos. No se fija `Content-Type`: el navegador lo pone junto
   * con el `boundary`, y escribirlo a mano rompe el multipart.
   */
  async function upload<T>(path: string, form: FormData, options: RequestOptions = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(buildUrl(base, path, options.params), {
        method: "POST",
        signal: options.signal,
        body: form,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw new ApiError(0, "NETWORK_ERROR", "Sin conexion con el servidor");
    }

    if (!response.ok) throw await toApiError(response);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    upload,
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("POST", path, body ?? {}, options),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PATCH", path, body ?? {}, options),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PUT", path, body ?? {}, options),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, undefined, options),
  };
}

/** Recursos del backend (proxy con tenant + auth). */
export const apiClient = createClient(appConfig.bffPrefix);

/** Rutas propias de Next: login, registro, logout, empresa activa. */
export const nextApi = createClient("/api");

export type ApiClient = typeof apiClient;
