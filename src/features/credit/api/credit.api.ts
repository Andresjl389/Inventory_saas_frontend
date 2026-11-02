import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type {
  AccountFilters,
  AccountSummary,
  AdjustAccountCommand,
  CreditSummary,
  CustomerAccount,
  RegisterPaymentCommand,
} from "../types/credit.types";

/** Rutas de fiado (seccion 10 de FRONTEND.md, "Cuentas de fiado"). */
export const creditApi = {
  summary: () => apiClient.get<CreditSummary>("/credit/summary"),

  /** Ordenada por saldo: el que mas debe primero. */
  accounts: (filters: AccountFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<AccountSummary>>("/credit/accounts", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        only_with_balance: filters.only_with_balance,
      },
    }),

  account: (customerId: string, page: number, size: number) =>
    apiClient.get<CustomerAccount>(`/credit/accounts/${customerId}`, {
      params: { page, size },
    }),

  /** Devuelve la cuenta ya actualizada. */
  registerPayment: (customerId: string, command: RegisterPaymentCommand) =>
    apiClient.post<CustomerAccount>(`/credit/accounts/${customerId}/payments`, command),

  adjust: (customerId: string, command: AdjustAccountCommand) =>
    apiClient.post<CustomerAccount>(`/credit/accounts/${customerId}/adjustments`, command),
};
