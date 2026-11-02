"use client";

import { useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { rolesApi } from "../api/roles.api";
import { roleKeys } from "../api/roles.keys";

export function useRoles(options: { enabled?: boolean } = {}) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: roleKeys.list(companyId),
    queryFn: () => rolesApi.list(),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}

/** El catalogo de permisos. Solo hace falta al editar un rol propio. */
export function usePermissionCatalog(options: { enabled?: boolean } = {}) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: roleKeys.permissions(companyId),
    queryFn: () => rolesApi.permissions(),
    enabled: options.enabled ?? true,
    staleTime: 30 * 60_000,
  });
}
