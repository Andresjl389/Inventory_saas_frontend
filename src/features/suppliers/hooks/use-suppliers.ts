"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { PartnerFilters } from "@/features/partners/types/partner.types";
import { useCompanyId } from "@/stores/tenant.store";

import { suppliersApi } from "../api/suppliers.api";
import { supplierKeys } from "../api/suppliers.keys";

export function useSuppliers(filters: PartnerFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: supplierKeys.list(companyId, filters),
    queryFn: ({ signal }) => suppliersApi.list(filters, signal),
    // Al paginar o buscar se mantiene la tabla en pantalla en vez de parpadear.
    placeholderData: keepPreviousData,
  });
}
