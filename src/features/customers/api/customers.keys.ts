import type { PartnerFilters } from "@/features/partners/types/partner.types";

/** Toda clave lleva el tenant delante: ver seccion 15 de FRONTEND.md. */
export const customerKeys = {
  all: (companyId: string) => ["customers", companyId] as const,
  lists: (companyId: string) => [...customerKeys.all(companyId), "list"] as const,
  list: (companyId: string, filters: PartnerFilters) =>
    [...customerKeys.lists(companyId), filters] as const,
  detail: (companyId: string, id: string) =>
    [...customerKeys.all(companyId), "detail", id] as const,
};
