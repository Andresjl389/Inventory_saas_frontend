import { cookies } from "next/headers";

import { apiEndpoint } from "@/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  COMPANY_COOKIE,
  REFRESH_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  companyCookieOptions,
  secureCookieOptions,
} from "./cookies";

/** `TokenPairDTO` del backend. */
export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type SessionCookies = {
  accessToken: string | null;
  refreshToken: string | null;
  companyId: string | null;
};

export async function readSessionCookies(): Promise<SessionCookies> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
    companyId: store.get(COMPANY_COOKIE)?.value ?? null,
  };
}

/** Escribe el par de tokens. Solo valido en Route Handlers y Server Actions. */
export async function writeTokenCookies(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    ...secureCookieOptions,
    maxAge: tokens.expires_in,
  });
  store.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    ...secureCookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function writeCompanyCookie(companyId: string): Promise<void> {
  const store = await cookies();
  store.set(COMPANY_COOKIE, companyId, companyCookieOptions);
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, COMPANY_COOKIE]) {
    store.set(name, "", { ...secureCookieOptions, httpOnly: name !== COMPANY_COOKIE, maxAge: 0 });
  }
}

/**
 * Canjea el refresh token por un par nuevo. Devuelve `null` si el backend lo
 * rechaza: en ese caso la sesion esta muerta y hay que volver a /login.
 */
export async function exchangeRefreshToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    const response = await fetch(apiEndpoint("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as TokenPair;
  } catch {
    return null;
  }
}
