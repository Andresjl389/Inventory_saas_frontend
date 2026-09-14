import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { apiEndpoint } from "@/config/env";
import { readSessionCookies, writeCompanyCookie } from "@/lib/auth/session";

const bodySchema = z.object({ companyId: z.uuid() });

type Membership = { company_id: string; is_active: boolean };

/**
 * Cambia la empresa activa.
 *
 * Antes de escribir la cookie comprobamos contra el backend que el usuario
 * pertenece a esa empresa. No es la barrera de seguridad (esa la pone
 * `get_tenant_context` y RLS), pero evita dejar la UI en un estado invalido.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Empresa invalida", details: {} } },
      { status: 422 },
    );
  }

  const { accessToken } = await readSessionCookies();
  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "No hay sesion activa", details: {} } },
      { status: 401 },
    );
  }

  const response = await fetch(apiEndpoint("/companies"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "No pudimos validar la empresa", details: {} } },
      { status: 401 },
    );
  }

  const memberships = (await response.json()) as Membership[];
  const allowed = memberships.some(
    (membership) => membership.company_id === parsed.data.companyId && membership.is_active,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: { code: "INVALID_MEMBERSHIP", message: "No tienes acceso a esta empresa", details: {} } },
      { status: 403 },
    );
  }

  await writeCompanyCookie(parsed.data.companyId);
  return NextResponse.json({ companyId: parsed.data.companyId });
}
