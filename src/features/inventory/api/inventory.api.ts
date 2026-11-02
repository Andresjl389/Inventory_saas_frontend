import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { AdjustStockInput, TransferStockInput } from "../schemas/inventory.schema";
import type {
  MovementFilters,
  ProductStock,
  StockFilters,
  StockMovement,
  TransferResult,
} from "../types/inventory.types";

export const inventoryApi = {
  stock: (filters: StockFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<ProductStock>>("/inventory/stock", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        product_id: filters.product_id ?? undefined,
        warehouse_id: filters.warehouse_id ?? undefined,
        only_non_zero: filters.only_non_zero,
      },
    }),

  movements: (filters: MovementFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<StockMovement>>("/inventory/movements", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        product_id: filters.product_id ?? undefined,
        warehouse_id: filters.warehouse_id ?? undefined,
        reference_id: filters.reference_id ?? undefined,
      },
    }),

  /** `quantity_delta` va con signo: negativo descuenta, positivo suma. */
  adjust: (input: AdjustStockInput) =>
    apiClient.post<ProductStock>("/inventory/adjustments", input),

  transfer: (input: TransferStockInput) =>
    apiClient.post<TransferResult>("/inventory/transfers", input),
};
