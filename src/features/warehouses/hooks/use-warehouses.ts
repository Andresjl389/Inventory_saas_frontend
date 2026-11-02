"use client";

import { useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { warehousesApi } from "../api/warehouses.api";
import { warehouseKeys } from "../api/warehouses.keys";

export function useWarehouses(isActive?: boolean) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: warehouseKeys.list(companyId, isActive),
    queryFn: () => warehousesApi.list(isActive),
    // Cambian muy poco y casi toda la operacion las necesita en un selector.
    staleTime: 5 * 60_000,
  });
}

/** Solo las operativas: es lo que puede elegirse en un ajuste, venta o compra. */
export function useActiveWarehouses() {
  return useWarehouses(true);
}
