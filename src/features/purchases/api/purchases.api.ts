import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type {
  CreatePurchaseCommand,
  Purchase,
  PurchaseFilters,
} from "../types/purchase.types";

/** Rutas de compras. */
export const purchasesApi = {
  list: (filters: PurchaseFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<Purchase>>("/purchases", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        status: filters.status ?? undefined,
        supplier_id: filters.supplier_id ?? undefined,
        warehouse_id: filters.warehouse_id ?? undefined,
      },
    }),

  get: (purchaseId: string) => apiClient.get<Purchase>(`/purchases/${purchaseId}`),

  create: (command: CreatePurchaseCommand) => apiClient.post<Purchase>("/purchases", command),

  /** `update_product_costs` va en la query, no en el cuerpo. */
  complete: (purchaseId: string, updateProductCosts: boolean) =>
    apiClient.post<Purchase>(`/purchases/${purchaseId}/complete`, undefined, {
      params: { update_product_costs: updateProductCosts },
    }),

  cancel: (purchaseId: string) => apiClient.post<Purchase>(`/purchases/${purchaseId}/cancel`),
};
