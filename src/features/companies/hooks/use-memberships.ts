"use client";

import { useQuery } from "@tanstack/react-query";

import { companiesApi } from "../api/companies.api";
import { companyKeys } from "../api/companies.keys";

export function useMemberships() {
  return useQuery({
    queryKey: companyKeys.memberships(),
    queryFn: () => companiesApi.listMemberships(),
    staleTime: 5 * 60_000,
  });
}
