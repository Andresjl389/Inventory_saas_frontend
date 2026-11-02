import type { PartnerInput } from "@/features/partners/schemas/partner.schema";
import type { Partner, PartnerFilters } from "@/features/partners/types/partner.types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export const suppliersApi = {
  list: (filters: PartnerFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<Partner>>("/suppliers", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        is_active: filters.is_active,
      },
    }),

  get: (id: string) => apiClient.get<Partner>(`/suppliers/${id}`),

  create: (input: PartnerInput) => apiClient.post<Partner>("/suppliers", input),

  update: (id: string, input: Partial<PartnerInput> & { is_active?: boolean }) =>
    apiClient.patch<Partner>(`/suppliers/${id}`, input),

  /** Borrado logico: las operaciones pasadas siguen apuntando aqui. */
  deactivate: (id: string) => apiClient.delete<Partner>(`/suppliers/${id}`),

  reactivate: (id: string) => apiClient.patch<Partner>(`/suppliers/${id}`, { is_active: true }),
};
