import type { PartnerInput } from "@/features/partners/schemas/partner.schema";
import type { Partner, PartnerFilters } from "@/features/partners/types/partner.types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export const customersApi = {
  list: (filters: PartnerFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<Partner>>("/customers", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        is_active: filters.is_active,
      },
    }),

  get: (id: string) => apiClient.get<Partner>(`/customers/${id}`),

  create: (input: PartnerInput) => apiClient.post<Partner>("/customers", input),

  update: (id: string, input: Partial<PartnerInput> & { is_active?: boolean }) =>
    apiClient.patch<Partner>(`/customers/${id}`, input),

  /** Borrado logico: las operaciones pasadas siguen apuntando aqui. */
  deactivate: (id: string) => apiClient.delete<Partner>(`/customers/${id}`),

  reactivate: (id: string) => apiClient.patch<Partner>(`/customers/${id}`, { is_active: true }),
};
