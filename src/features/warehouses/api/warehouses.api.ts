import { apiClient } from "@/lib/api/client";

import type { WarehouseInput } from "../schemas/warehouse.schema";
import type { Warehouse } from "../types/warehouse.types";

export const warehousesApi = {
  list: (isActive?: boolean) =>
    apiClient.get<Warehouse[]>("/warehouses", { params: { is_active: isActive } }),

  get: (warehouseId: string) => apiClient.get<Warehouse>(`/warehouses/${warehouseId}`),

  create: (input: WarehouseInput) => apiClient.post<Warehouse>("/warehouses", input),

  update: (warehouseId: string, input: Partial<WarehouseInput> & { is_active?: boolean }) =>
    apiClient.patch<Warehouse>(`/warehouses/${warehouseId}`, input),

  /** Borrado logico: los movimientos de stock apuntan a la bodega para siempre. */
  deactivate: (warehouseId: string) =>
    apiClient.delete<Warehouse>(`/warehouses/${warehouseId}`),

  reactivate: (warehouseId: string) =>
    apiClient.patch<Warehouse>(`/warehouses/${warehouseId}`, { is_active: true }),
};
