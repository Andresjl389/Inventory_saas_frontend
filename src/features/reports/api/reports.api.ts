import type { AuditEntry } from "@/features/audit/types/audit.types";
import type { AuditFilters } from "@/features/platform/types/platform.types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type {
  InventoryValuation,
  LowStockReport,
  SalesReport,
} from "../types/reports.types";

export const reportsApi = {
  sales: (since: string | undefined, limit: number) =>
    apiClient.get<SalesReport>("/reports/sales", { params: { since, limit } }),

  valuation: () => apiClient.get<InventoryValuation>("/reports/inventory-valuation"),

  lowStock: (limit: number) =>
    apiClient.get<LowStockReport>("/reports/low-stock", { params: { limit } }),

  /** La auditoria de la empresa. Los eventos de plataforma no salen aqui. */
  audit: (filters: AuditFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<AuditEntry>>("/reports/audit", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        action: filters.action ?? undefined,
      },
    }),
};
