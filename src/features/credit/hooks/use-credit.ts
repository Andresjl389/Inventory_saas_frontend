"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { creditApi } from "../api/credit.api";
import { creditKeys } from "../api/credit.keys";
import type { AccountFilters } from "../types/credit.types";

export const ACCOUNT_HISTORY_SIZE = 20;

export function useCreditSummary({ enabled = true }: { enabled?: boolean } = {}) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: creditKeys.summary(companyId),
    queryFn: () => creditApi.summary(),
    enabled,
  });
}

export function useCreditAccounts(filters: AccountFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: creditKeys.list(companyId, filters),
    queryFn: ({ signal }) => creditApi.accounts(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerAccount(
  customerId: string | null,
  page = 1,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: creditKeys.account(companyId, customerId ?? "", page),
    queryFn: () => creditApi.account(customerId as string, page, ACCOUNT_HISTORY_SIZE),
    enabled: enabled && Boolean(customerId),
    placeholderData: keepPreviousData,
  });
}
