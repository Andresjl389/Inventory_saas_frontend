"use client";

import { useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { companiesApi } from "../api/companies.api";
import { companyKeys } from "../api/companies.keys";

export function useCurrentCompany() {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: companyKeys.detail(companyId),
    queryFn: () => companiesApi.current(),
    staleTime: 5 * 60_000,
  });
}
