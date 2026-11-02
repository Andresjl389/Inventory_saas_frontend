"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { formatMoney } from "@/lib/format";
import { useCompanyId } from "@/stores/tenant.store";

import { creditApi } from "../api/credit.api";
import { creditKeys } from "../api/credit.keys";
import type { AdjustAccountCommand, RegisterPaymentCommand } from "../types/credit.types";

/**
 * Un abono cambia la cuenta, la lista (ordenada por saldo) y el total que se
 * debe, asi que se invalida todo el fiado de la empresa de una vez.
 */
function useInvalidateCredit() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: creditKeys.all(companyId) });
}

export function useRegisterPayment(customerId: string) {
  const invalidate = useInvalidateCredit();

  return useMutation({
    meta: { silent: true },
    mutationFn: (command: RegisterPaymentCommand) =>
      creditApi.registerPayment(customerId, command),
    onSuccess: async (account, command) => {
      await invalidate();
      toast.success(
        `Abono de ${formatMoney(command.amount)} registrado. Saldo: ${formatMoney(account.owes)}`,
      );
    },
  });
}

export function useAdjustAccount(customerId: string) {
  const invalidate = useInvalidateCredit();

  return useMutation({
    meta: { silent: true },
    mutationFn: (command: AdjustAccountCommand) => creditApi.adjust(customerId, command),
    onSuccess: async () => {
      await invalidate();
      toast.success("Ajuste registrado");
    },
  });
}
