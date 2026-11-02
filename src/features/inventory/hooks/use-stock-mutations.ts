"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCompanyId } from "@/stores/tenant.store";

import { inventoryApi } from "../api/inventory.api";
import { inventoryKeys } from "../api/inventory.keys";
import type { AdjustStockInput, TransferStockInput } from "../schemas/inventory.schema";

/**
 * Toda escritura invalida existencias y movimientos a la vez: un ajuste cambia
 * el stock y ademas deja su rastro en la auditoria.
 */
function useInvalidateInventory() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: inventoryKeys.all(companyId) });
}

export function useAdjustStock() {
  const invalidate = useInvalidateInventory();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: AdjustStockInput) => inventoryApi.adjust(input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Ajuste registrado");
    },
  });
}

export function useTransferStock() {
  const invalidate = useInvalidateInventory();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: TransferStockInput) => inventoryApi.transfer(input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Traslado registrado");
    },
  });
}
