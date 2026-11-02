"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { PartnerFilters } from "@/features/partners/types/partner.types";
import { useCompanyId } from "@/stores/tenant.store";

import { customersApi } from "../api/customers.api";
import { customerKeys } from "../api/customers.keys";

export function useCustomers(filters: PartnerFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: customerKeys.list(companyId, filters),
    queryFn: ({ signal }) => customersApi.list(filters, signal),
    // Al paginar o buscar se mantiene la tabla en pantalla en vez de parpadear.
    placeholderData: keepPreviousData,
  });
}
