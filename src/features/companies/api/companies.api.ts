import { apiClient, nextApi } from "@/lib/api/client";

import type { AddMemberInput, CreateCompanyInput } from "../schemas/company.schema";
import type { Company, CompanyMember, Membership } from "../types/company.types";

export const companiesApi = {
  /** Empresas del usuario. No necesita `X-Company-ID`. */
  listMemberships: () => apiClient.get<Membership[]>("/companies"),

  create: (input: CreateCompanyInput) => apiClient.post<Company>("/companies", input),

  current: () => apiClient.get<Company>("/companies/current"),

  listMembers: () => apiClient.get<CompanyMember[]>("/companies/current/members"),

  addMember: (input: AddMemberInput) =>
    apiClient.post<CompanyMember>("/companies/current/members", input),

  /** Cambia la cookie `inv_cid`. Es una ruta de Next, no del backend. */
  setActive: (companyId: string) =>
    nextApi.post<{ companyId: string }>("/session/company", { companyId }),
};
