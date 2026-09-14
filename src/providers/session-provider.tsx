"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { can, type CompanyRole } from "@/config/permissions";
import type { User } from "@/features/auth/types/auth.types";
import type { Membership } from "@/features/companies/types/company.types";
import { TenantStoreProvider, useTenant } from "@/stores/tenant.store";

type SessionValue = {
  user: User;
  memberships: Membership[];
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  user,
  memberships,
  tenant,
  children,
}: SessionValue & {
  tenant: { companyId: string; companyName: string; role: CompanyRole };
  children: ReactNode;
}) {
  const value = useMemo(() => ({ user, memberships }), [user, memberships]);

  return (
    <SessionContext.Provider value={value}>
      <TenantStoreProvider value={tenant}>{children}</TenantStoreProvider>
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
 * backend vuelve a comprobar cada permiso en `require_permission(...)`.
 */
export function usePermission(permission: string): boolean {
  const { role } = useTenant();
  return can(role, permission);
}
