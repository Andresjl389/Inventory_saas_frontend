import type { PartnerFilters } from "@/features/partners/types/partner.types";

/** Toda clave lleva el tenant delante: ver seccion 15 de FRONTEND.md. */
export const supplierKeys = {
  all: (companyId: string) => ["suppliers", companyId] as const,
  lists: (companyId: string) => [...supplierKeys.all(companyId), "list"] as const,
  list: (companyId: string, filters: PartnerFilters) =>
    [...supplierKeys.lists(companyId), filters] as const,
  detail: (companyId: string, id: string) =>
    [...supplierKeys.all(companyId), "detail", id] as const,
};
