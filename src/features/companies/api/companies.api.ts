import { apiClient, nextApi } from "@/lib/api/client";

import type { AddMemberInput, ChangeMemberRoleInput } from "../schemas/company.schema";
import type { Company, CompanyMember, Membership } from "../types/company.types";

export const companiesApi = {
  /** Empresas del usuario. No necesita `X-Company-ID`. */
  listMemberships: () => apiClient.get<Membership[]>("/companies"),

  current: () => apiClient.get<Company>("/companies/current"),

  listMembers: () => apiClient.get<CompanyMember[]>("/companies/current/members"),

  /**
   * `withAccount` es solo del formulario. Los datos de cuenta se envian unicamente
   * cuando toca crearla; enviarlos siempre haria fallar a un usuario ya existente.
   */
  addMember: ({ withAccount, password, first_name, last_name, ...input }: AddMemberInput) =>
    apiClient.post<CompanyMember>("/companies/current/members", {
      ...input,
      ...(withAccount ? { password, first_name, last_name } : {}),
    }),

  /** Cambia el rol de un miembro, o lo activa y desactiva. */
  changeMemberRole: (userId: string, input: ChangeMemberRoleInput) =>
    apiClient.patch<CompanyMember>(`/companies/current/members/${userId}`, input),

  /** Cambia la cookie `inv_cid`. Es una ruta de Next, no del backend. */
  setActive: (companyId: string) =>
    nextApi.post<{ companyId: string }>("/session/company", { companyId }),
};
