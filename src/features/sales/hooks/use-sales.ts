"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { salesApi } from "../api/sales.api";
import { saleKeys } from "../api/sales.keys";
import type { SaleFilters } from "../types/sale.types";

export function useSales(filters: SaleFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: saleKeys.list(companyId, filters),
    queryFn: ({ signal }) => salesApi.list(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSale(saleId: string | null) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: saleKeys.detail(companyId, saleId ?? ""),
    queryFn: () => salesApi.get(saleId as string),
    enabled: Boolean(saleId),
  });
}
