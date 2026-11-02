import type { AuditFilters } from "@/features/platform/types/platform.types";

export const reportKeys = {
  all: (companyId: string) => ["reports", companyId] as const,
  /** Se indexa por el rango elegido, no por el `since` calculado: si no, la
   *  clave cambiaria en cada render y volveria a consultar cada vez. */
  sales: (companyId: string, range: string, limit: number) =>
    [...reportKeys.all(companyId), "sales", range, limit] as const,
  valuation: (companyId: string) => [...reportKeys.all(companyId), "valuation"] as const,
  lowStock: (companyId: string, limit: number) =>
    [...reportKeys.all(companyId), "low-stock", limit] as const,
  audit: (companyId: string, filters: AuditFilters) =>
    [...reportKeys.all(companyId), "audit", filters] as const,
};
