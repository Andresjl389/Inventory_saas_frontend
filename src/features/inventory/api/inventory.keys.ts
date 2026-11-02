import type { MovementFilters, StockFilters } from "../types/inventory.types";

export const inventoryKeys = {
  all: (companyId: string) => ["inventory", companyId] as const,
  stock: (companyId: string) => [...inventoryKeys.all(companyId), "stock"] as const,
  stockList: (companyId: string, filters: StockFilters) =>
    [...inventoryKeys.stock(companyId), filters] as const,
  movements: (companyId: string) => [...inventoryKeys.all(companyId), "movements"] as const,
  movementList: (companyId: string, filters: MovementFilters) =>
    [...inventoryKeys.movements(companyId), filters] as const,
};
