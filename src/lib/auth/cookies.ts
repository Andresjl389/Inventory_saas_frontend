/**
 * Nombres y opciones de las cookies de sesion.
 *
 * Los tokens viven en cookies httpOnly: un XSS no puede leerlos. La empresa
 * activa tambien es una cookie (no httpOnly) para que el shell del dashboard
 * pueda renderizarse en servidor sin una ida y vuelta extra, pero el backend
 * la revalida en cada peticion contra la tabla de membresias.
 */
export const ACCESS_TOKEN_COOKIE = "inv_at";
export const REFRESH_TOKEN_COOKIE = "inv_rt";
export const COMPANY_COOKIE = "inv_cid";

/** 14 dias: `REFRESH_TOKEN_EXPIRE_DAYS` del backend. */
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 14;
export const COMPANY_MAX_AGE = 60 * 60 * 24 * 365;

export const secureCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export const companyCookieOptions = {
  httpOnly: false,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COMPANY_MAX_AGE,
} as const;
