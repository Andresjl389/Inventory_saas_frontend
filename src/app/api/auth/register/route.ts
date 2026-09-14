import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { apiEndpoint } from "@/config/env";
import { toApiError } from "@/lib/api/errors";
import { writeCompanyCookie, writeTokenCookies, type TokenPair } from "@/lib/auth/session";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  company_name: z.string().min(1).max(200),
});

function apiErrorResponse(code: string, message: string, status: number, details = {}) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiErrorResponse("VALIDATION_ERROR", "Datos invalidos", 422);
  }

  const created = await fetch(apiEndpoint("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  }).catch(() => null);

  if (!created) return apiErrorResponse("NETWORK_ERROR", "Sin conexion con la API", 502);

  if (!created.ok) {
    const error = await toApiError(created);
    return apiErrorResponse(error.code, error.message, error.status, error.details);
  }

  const { company_id: companyId } = (await created.json()) as { company_id: string | null };

  // El registro no devuelve tokens: iniciamos sesion para dejar al usuario dentro.
  const session = await fetch(apiEndpoint("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
    cache: "no-store",
  }).catch(() => null);

  if (!session?.ok) {
    // La cuenta existe; solo falta el login. No es un error fatal.
    return NextResponse.json({ companyId: null, requiresLogin: true }, { status: 201 });
  }

  const tokens = (await session.json()) as TokenPair;
  await writeTokenCookies(tokens);
  if (companyId) await writeCompanyCookie(companyId);

  return NextResponse.json({ companyId, requiresLogin: false }, { status: 201 });
}
