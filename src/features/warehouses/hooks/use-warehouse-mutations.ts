"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCompanyId } from "@/stores/tenant.store";

import { warehousesApi } from "../api/warehouses.api";
import { warehouseKeys } from "../api/warehouses.keys";
import type { WarehouseInput } from "../schemas/warehouse.schema";

function useInvalidateWarehouses() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all(companyId) });
}

export function useCreateWarehouse() {
  const invalidate = useInvalidateWarehouses();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: WarehouseInput) => warehousesApi.create(input),
    onSuccess: async (warehouse) => {
      await invalidate();
      toast.success(`Bodega ${warehouse.name} creada`);
    },
  });
}

export function useUpdateWarehouse() {
  const invalidate = useInvalidateWarehouses();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ warehouseId, input }: { warehouseId: string; input: WarehouseInput }) =>
      warehousesApi.update(warehouseId, input),
    onSuccess: async (warehouse) => {
      await invalidate();
      toast.success(`Bodega ${warehouse.name} actualizada`);
    },
  });
}

export function useToggleWarehouseActive() {
  const invalidate = useInvalidateWarehouses();

  return useMutation({
    mutationFn: ({ warehouseId, isActive }: { warehouseId: string; isActive: boolean }) =>
      isActive
        ? warehousesApi.deactivate(warehouseId)
        : warehousesApi.reactivate(warehouseId),
    onSuccess: async (warehouse) => {
      await invalidate();
      toast.success(
        warehouse.is_active
          ? `${warehouse.name} esta activa`
          : `${warehouse.name} se desactivo`,
      );
    },
  });
}
