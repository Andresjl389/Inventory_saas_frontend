"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { inventoryApi } from "../api/inventory.api";
import { inventoryKeys } from "../api/inventory.keys";
import type { MovementFilters, StockFilters } from "../types/inventory.types";

export function useStock(filters: StockFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: inventoryKeys.stockList(companyId, filters),
    queryFn: ({ signal }) => inventoryApi.stock(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useStockMovements(filters: MovementFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: inventoryKeys.movementList(companyId, filters),
    queryFn: ({ signal }) => inventoryApi.movements(filters, signal),
    placeholderData: keepPreviousData,
  });
}
