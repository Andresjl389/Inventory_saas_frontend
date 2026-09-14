import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { apiEndpoint } from "@/config/env";
import { toApiError } from "@/lib/api/errors";
import { writeCompanyCookie, writeTokenCookies, type TokenPair } from "@/lib/auth/session";

import { resolveInitialCompany } from "../shared";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Datos invalidos", details: {} } },
      { status: 422 },
    );
  }

  const upstream = await fetch(apiEndpoint("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { error: { code: "NETWORK_ERROR", message: "Sin conexion con la API", details: {} } },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const error = await toApiError(upstream);
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  const tokens = (await upstream.json()) as TokenPair;
  await writeTokenCookies(tokens);

  // Con una sola empresa no tiene sentido mostrar el selector.
  const companyId = await resolveInitialCompany(tokens.access_token);
  if (companyId) await writeCompanyCookie(companyId);

  return NextResponse.json({ companyId });
}
