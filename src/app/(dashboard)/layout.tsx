import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell/app-shell";
import type { User } from "@/features/auth/types/auth.types";
import {
  membershipRole,
  type Membership,
} from "@/features/companies/types/company.types";
import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { readSessionCookies } from "@/lib/auth/session";
import { SessionProvider } from "@/providers/session-provider";

import { isPlatformAdmin } from "../(platform)/layout";

/**
 * Shell del dashboard. Es un Server Component: el usuario, sus empresas y el
 * tenant activo se resuelven antes del primer pintado, asi que la barra
 * lateral nunca aparece vacia ni parpadea.
 *
 * El middleware ya renovo el token si hacia falta; si aun asi el backend
 * responde 401, la sesion esta rota y toca volver a /login.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { companyId } = await readSessionCookies();
  if (!companyId) redirect("/select-company");

  let user: User;
  let memberships: Membership[];

  try {
    [user, memberships] = await Promise.all([
      serverApi<User>("/auth/me"),
      serverApi<Membership[]>("/companies"),
    ]);
  } catch (error) {
    if (isApiError(error)) {
      if (error.isUnauthorized) redirect("/login");
      // La empresa quedo suspendida entre dos peticiones.
      if (error.code === "INVALID_COMPANY") redirect("/company-suspended");
    }
    throw error;
  }

  // La cookie puede apuntar a una empresa de la que ya no se es miembro.
  const membership = memberships.find(
    (item) => item.company_id === companyId && item.is_active,
  );
  if (!membership) redirect("/select-company");

  const platformAdmin = await isPlatformAdmin();

  return (
    <SessionProvider
      user={user}
      memberships={memberships}
      isPlatformAdmin={platformAdmin}
      tenant={{
        companyId: membership.company_id,
        companyName: membership.company_name,
        roleCode: membershipRole(membership),
        permissions: membership.permissions ?? [],
      }}
    >
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
