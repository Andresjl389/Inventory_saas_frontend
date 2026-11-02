"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { AuditFilters } from "@/features/platform/types/platform.types";
import { useCompanyId } from "@/stores/tenant.store";

import { reportsApi } from "../api/reports.api";
import { reportKeys } from "../api/reports.keys";
import { rangeToSince, type SalesRange } from "../types/reports.types";

export function useSalesReport(range: SalesRange, limit = 8) {
  const companyId = useCompanyId();
  const since = rangeToSince(range);

  return useQuery({
    // `since` se calcula desde "ahora": se fija en la clave para que no cambie
    // en cada render y dispare una consulta nueva cada vez.
    queryKey: reportKeys.sales(companyId, range, limit),
    queryFn: () => reportsApi.sales(since, limit),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useInventoryValuation() {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: reportKeys.valuation(companyId),
    queryFn: () => reportsApi.valuation(),
    staleTime: 60_000,
  });
}

export function useLowStock(limit = 50) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: reportKeys.lowStock(companyId, limit),
    queryFn: () => reportsApi.lowStock(limit),
    staleTime: 60_000,
  });
}

export function useCompanyAudit(filters: AuditFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: reportKeys.audit(companyId, filters),
    queryFn: ({ signal }) => reportsApi.audit(filters, signal),
    placeholderData: keepPreviousData,
  });
}
