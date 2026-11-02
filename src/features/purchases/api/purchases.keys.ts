import type { PurchaseFilters } from "../types/purchase.types";

export const purchaseKeys = {
  all: (companyId: string) => ["purchases", companyId] as const,
  lists: (companyId: string) => [...purchaseKeys.all(companyId), "list"] as const,
  list: (companyId: string, filters: PurchaseFilters) =>
    [...purchaseKeys.lists(companyId), filters] as const,
  detail: (companyId: string, purchaseId: string) =>
    [...purchaseKeys.all(companyId), "detail", purchaseId] as const,
};
