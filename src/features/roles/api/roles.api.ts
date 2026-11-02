import { apiClient } from "@/lib/api/client";

import type { RoleInput, UpdateRoleInput } from "../schemas/role.schema";
import type { Permission, Role } from "../types/role.types";

export const rolesApi = {
  /** Los cuatro roles del sistema mas los que haya definido la empresa. */
  list: () => apiClient.get<Role[]>("/roles"),

  permissions: () => apiClient.get<Permission[]>("/roles/permissions"),

  create: (input: RoleInput) => apiClient.post<Role>("/roles", input),

  update: (roleId: string, input: UpdateRoleInput) =>
    apiClient.patch<Role>(`/roles/${roleId}`, input),

  remove: (roleId: string) => apiClient.delete<void>(`/roles/${roleId}`),
};
