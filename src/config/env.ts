/**
 * Variables de entorno.
 *
 * `API_URL` NO es publica a proposito: el navegador nunca habla directo con
 * FastAPI. Todo pasa por los Route Handlers de Next (`/api/bff/...`), que son
 * los unicos que conocen la URL real y los tokens (cookies httpOnly).
 */
export const serverEnv = {
  apiUrl: (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, ""),
  apiPrefix: process.env.API_V1_PREFIX ?? "/api/v1",
} as const;

export function apiEndpoint(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${serverEnv.apiUrl}${serverEnv.apiPrefix}${clean}`;
}

export const appConfig = {
  name: "Inventario",
  fullName: "Inventory SaaS",
  /** Prefijo del proxy que expone Next al navegador. */
  bffPrefix: "/api/bff",
  defaultPageSize: 20,
  /** Formato de numeros, fechas y moneda. Cambialo aqui, no en cada vista. */
  locale: "es-CO",
  currency: "COP",
  /** Tope del backend: `MAX_PAGE_SIZE` en app/domain/shared/pagination.py */
  maxPageSize: 100,
} as const;
