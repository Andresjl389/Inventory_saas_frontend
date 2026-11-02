"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { inventoryKeys } from "@/features/inventory/api/inventory.keys";
import { productKeys } from "@/features/products/api/products.keys";
import { useCompanyId } from "@/stores/tenant.store";

import { purchasesApi } from "../api/purchases.api";
import { purchaseKeys } from "../api/purchases.keys";
import type { CreatePurchaseCommand } from "../types/purchase.types";

/**
 * Completar una compra suma stock y, si se pide, reescribe el `cost_price` de
 * los productos. Por eso se invalidan tambien inventario y catalogo: si no, el
 * margen que muestra la tabla de productos se quedaria con el coste viejo.
 */
function useInvalidatePurchases() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: purchaseKeys.all(companyId) });
    await queryClient.invalidateQueries({ queryKey: inventoryKeys.all(companyId) });
    await queryClient.invalidateQueries({ queryKey: productKeys.all(companyId) });
  };
}

export function useCreatePurchase() {
  const invalidate = useInvalidatePurchases();

  return useMutation({
    mutationFn: (command: CreatePurchaseCommand) => purchasesApi.create(command),
    onSuccess: async (purchase) => {
      await invalidate();
      toast.success(
        purchase.status === "COMPLETED"
          ? "Compra registrada"
          : "Borrador de compra guardado",
      );
    },
  });
}

export function usePurchaseTransition() {
  const invalidate = useInvalidatePurchases();

  return useMutation({
    mutationFn: ({
      purchaseId,
      action,
      updateProductCosts = false,
    }: {
      purchaseId: string;
      action: "complete" | "cancel";
      updateProductCosts?: boolean;
    }) =>
      action === "complete"
        ? purchasesApi.complete(purchaseId, updateProductCosts)
        : purchasesApi.cancel(purchaseId),
    onSuccess: async (purchase) => {
      await invalidate();
      toast.success(
        purchase.status === "COMPLETED" ? "Compra completada" : "Compra cancelada",
      );
    },
  });
}
