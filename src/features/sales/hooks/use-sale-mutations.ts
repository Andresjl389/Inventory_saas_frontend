"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { creditKeys } from "@/features/credit/api/credit.keys";
import { inventoryKeys } from "@/features/inventory/api/inventory.keys";
import { useCompanyId } from "@/stores/tenant.store";

import { salesApi } from "../api/sales.api";
import { saleKeys } from "../api/sales.keys";
import type { CreateSaleCommand } from "../types/sale.types";

/**
 * Una venta completada descuenta stock, asi que ademas de las ventas hay que
 * invalidar el inventario: si no, el tablero seguiria mostrando existencias
 * que ya se vendieron. Y si quedo fiada (o se cancela una que lo estaba),
 * tambien cambia la cuenta del cliente: el carrito ya la habia consultado para
 * mostrar el cupo, y sin invalidarla la cuenta mostraria el saldo de antes.
 */
function useInvalidateSales() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: saleKeys.all(companyId) });
    await queryClient.invalidateQueries({ queryKey: inventoryKeys.all(companyId) });
    await queryClient.invalidateQueries({ queryKey: creditKeys.all(companyId) });
  };
}

export function useCreateSale() {
  const invalidate = useInvalidateSales();

  return useMutation({
    mutationFn: (command: CreateSaleCommand) => salesApi.create(command),
    onSuccess: async (sale) => {
      await invalidate();
      toast.success(
        sale.status === "COMPLETED" ? "Venta registrada" : "Borrador de venta guardado",
      );
    },
  });
}

export function useSaleTransition() {
  const invalidate = useInvalidateSales();

  return useMutation({
    mutationFn: ({
      saleId,
      action,
    }: {
      saleId: string;
      action: "complete" | "cancel" | "refund";
    }) => salesApi[action](saleId),
    onSuccess: async (sale) => {
      await invalidate();
      const messages = {
        COMPLETED: "Venta completada",
        CANCELLED: "Venta cancelada",
        REFUNDED: "Venta reembolsada",
        DRAFT: "Venta actualizada",
      } as const;
      toast.success(messages[sale.status]);
    },
  });
}
