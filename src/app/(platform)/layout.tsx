import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PlatformShell } from "@/components/shared/platform-shell/platform-shell";
import type { User } from "@/features/auth/types/auth.types";
import type { Membership } from "@/features/companies/types/company.types";
import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { readSessionCookies } from "@/lib/auth/session";
import { SessionProvider } from "@/providers/session-provider";

/**
 * Comprueba si el usuario opera la plataforma.
 *
 * `UserDTO` no expone `is_superuser`, asi que la unica senal disponible es
 * preguntar por un endpoint de plataforma: si responde, lo es. Cuando el
 * backend anada ese campo a `/auth/me`, esta sonda sobra.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  try {
    await serverApi("/admin/stats");
    return true;
  } catch (error) {
    if (isApiError(error) && (error.isForbidden || error.isUnauthorized)) return false;
    throw error;
  }
}

/**
 * Shell de plataforma.
 *
 * A diferencia del dashboard, aqui NO se exige una empresa activa: quien
 * administra el SaaS puede no pertenecer a ninguna, y de hecho el primer
 * superusuario que crea el CLI no pertenece a ninguna.
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const { accessToken } = await readSessionCookies();
  if (!accessToken) redirect("/login");

  let user: User;
  let memberships: Membership[];

  try {
    [user, memberships] = await Promise.all([
      serverApi<User>("/auth/me"),
      serverApi<Membership[]>("/companies"),
    ]);
  } catch (error) {
    if (isApiError(error) && error.isUnauthorized) redirect("/login");
    throw error;
  }

  if (!(await isPlatformAdmin())) redirect("/dashboard");

  return (
    <SessionProvider user={user} memberships={memberships} isPlatformAdmin>
      <PlatformShell hasCompanies={memberships.some((item) => item.is_active)}>
        {children}
      </PlatformShell>
    </SessionProvider>
  );
}
