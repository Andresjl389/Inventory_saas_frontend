import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE, COMPANY_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

/**
 * Enrutado de sesion. No valida firmas ni permisos: eso es del backend y de
 * RLS. Aqui solo se decide a que pagina mandar al usuario.
 */

const PUBLIC_ROUTES = ["/login", "/register"];

/**
 * Lee `exp` del JWT sin verificar la firma.
 *
 * Es legitimo para decidir una navegacion: el secreto vive en el backend y
 * quien de verdad acepta o rechaza el token es FastAPI. Solo sirve para saber
 * si conviene pasar por /api/auth/refresh antes de renderizar el dashboard,
 * porque un Server Component no puede renovar cookies por su cuenta.
 */
function isAccessTokenExpired(token: string | undefined): boolean {
  if (!token) return true;

  const payload = token.split(".")[1];
  if (!payload) return true;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    if (typeof decoded.exp !== "number") return true;
    // 15 s de margen para no entrar con un token que vence a mitad del render.
    return decoded.exp * 1000 <= Date.now() + 15_000;
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasCompany = Boolean(request.cookies.get(COMPANY_COOKIE)?.value);
  const hasSession = Boolean(accessToken) || Boolean(refreshToken);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (isPublic) {
    if (hasSession) {
      return NextResponse.redirect(
        new URL(hasCompany ? "/dashboard" : "/select-company", request.url),
      );
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (isAccessTokenExpired(accessToken) && refreshToken) {
    const refresh = new URL("/api/auth/refresh", request.url);
    refresh.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(refresh);
  }

  if (pathname === "/select-company" || pathname === "/company-suspended") {
    return NextResponse.next();
  }

  /*
   * El area de plataforma no pertenece a ningun inquilino: quien administra el
   * SaaS puede no tener empresa, asi que no se le puede exigir una. Quien no
   * sea administrador lo rebota el layout, que es quien puede preguntarselo al
   * backend.
   */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  if (!hasCompany) {
    return NextResponse.redirect(new URL("/select-company", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Todo menos las rutas de /api (tienen su propia autenticacion), los
     * estaticos de Next y los archivos con extension.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
