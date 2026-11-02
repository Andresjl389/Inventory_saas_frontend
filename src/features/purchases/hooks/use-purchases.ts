"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { purchasesApi } from "../api/purchases.api";
import { purchaseKeys } from "../api/purchases.keys";
import type { PurchaseFilters } from "../types/purchase.types";

export function usePurchases(filters: PurchaseFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: purchaseKeys.list(companyId, filters),
    queryFn: ({ signal }) => purchasesApi.list(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePurchase(purchaseId: string | null) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: purchaseKeys.detail(companyId, purchaseId ?? ""),
    queryFn: () => purchasesApi.get(purchaseId as string),
    enabled: Boolean(purchaseId),
  });
}
