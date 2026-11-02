import type { AccountFilters } from "../types/credit.types";

/** Toda clave lleva el tenant delante: ver seccion 15 de FRONTEND.md. */
export const creditKeys = {
  all: (companyId: string) => ["credit", companyId] as const,
  summary: (companyId: string) => [...creditKeys.all(companyId), "summary"] as const,
  lists: (companyId: string) => [...creditKeys.all(companyId), "list"] as const,
  list: (companyId: string, filters: AccountFilters) =>
    [...creditKeys.lists(companyId), filters] as const,
  account: (companyId: string, customerId: string, page: number) =>
    [...creditKeys.all(companyId), "account", customerId, page] as const,
};
