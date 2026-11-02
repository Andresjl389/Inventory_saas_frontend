import type { SaleFilters } from "../types/sale.types";

export const saleKeys = {
  all: (companyId: string) => ["sales", companyId] as const,
  lists: (companyId: string) => [...saleKeys.all(companyId), "list"] as const,
  list: (companyId: string, filters: SaleFilters) =>
    [...saleKeys.lists(companyId), filters] as const,
  detail: (companyId: string, saleId: string) =>
    [...saleKeys.all(companyId), "detail", saleId] as const,
};
