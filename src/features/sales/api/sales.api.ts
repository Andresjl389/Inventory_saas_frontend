import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { CreateSaleCommand, Sale, SaleFilters } from "../types/sale.types";

/** Rutas de ventas. */
export const salesApi = {
  list: (filters: SaleFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<Sale>>("/sales", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        status: filters.status ?? undefined,
        customer_id: filters.customer_id ?? undefined,
        warehouse_id: filters.warehouse_id ?? undefined,
      },
    }),

  get: (saleId: string) => apiClient.get<Sale>(`/sales/${saleId}`),

  create: (command: CreateSaleCommand) => apiClient.post<Sale>("/sales", command),

  complete: (saleId: string) => apiClient.post<Sale>(`/sales/${saleId}/complete`),

  cancel: (saleId: string) => apiClient.post<Sale>(`/sales/${saleId}/cancel`),

  refund: (saleId: string) => apiClient.post<Sale>(`/sales/${saleId}/refund`),
};
