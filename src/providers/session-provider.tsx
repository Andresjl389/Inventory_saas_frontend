"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { RoleCode } from "@/config/permissions";
import { useEffectivePermissions } from "@/features/roles/hooks/use-effective-permissions";
import type { User } from "@/features/auth/types/auth.types";
import type { Membership } from "@/features/companies/types/company.types";
import { TenantStoreProvider } from "@/stores/tenant.store";

type SessionValue = {
  user: User;
  memberships: Membership[];
  /** Solo lo sabe el servidor, y solo para ensenar el acceso a /admin. */
  isPlatformAdmin: boolean;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  user,
  memberships,
  isPlatformAdmin = false,
  tenant,
  children,
}: Omit<SessionValue, "isPlatformAdmin"> & {
  isPlatformAdmin?: boolean;
  /**
   * Ausente en el area de plataforma: quien opera el SaaS no esta dentro de
   * ninguna empresa, asi que alli no hay tenant que proveer.
   */
  tenant?: {
    companyId: string;
    companyName: string;
    roleCode: RoleCode;
    permissions: readonly string[];
  };
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ user, memberships, isPlatformAdmin }),
    [user, memberships, isPlatformAdmin],
  );

  return (
    <SessionContext.Provider value={value}>
      {tenant ? <TenantStoreProvider value={tenant}>{children}</TenantStoreProvider> : children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return value;
}

/**
 * Oculta acciones que el rol actual no puede ejecutar. Es solo cosmetico: el
 * backend vuelve a comprobar cada permiso en `require_permission(...)`, y un
 * boton oculto no es seguridad.
 *
 * De donde salen los permisos, en `useEffectivePermissions`.
 */
export function usePermission(permission: string): boolean {
  const { can } = useEffectivePermissions();
  return can(permission);
}
