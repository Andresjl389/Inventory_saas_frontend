"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { companyKeys } from "@/features/companies/api/companies.keys";
import { useCompanyId } from "@/stores/tenant.store";

import { rolesApi } from "../api/roles.api";
import { roleKeys } from "../api/roles.keys";
import type { RoleInput, UpdateRoleInput } from "../schemas/role.schema";

/**
 * Cambiar un rol cambia lo que pueden hacer sus miembros, asi que ademas de
 * los roles se invalida la lista de miembros.
 */
function useInvalidateRoles() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: roleKeys.all(companyId) });
    await queryClient.invalidateQueries({ queryKey: companyKeys.members(companyId) });
  };
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: RoleInput) => rolesApi.create(input),
    onSuccess: async (role) => {
      await invalidate();
      toast.success(`Rol ${role.name} creado`);
    },
  });
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoles();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ roleId, input }: { roleId: string; input: UpdateRoleInput }) =>
      rolesApi.update(roleId, input),
    onSuccess: async (role) => {
      await invalidate();
      toast.success(`Rol ${role.name} actualizado`);
    },
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();

  return useMutation({
    mutationFn: (roleId: string) => rolesApi.remove(roleId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Rol eliminado");
    },
  });
}
