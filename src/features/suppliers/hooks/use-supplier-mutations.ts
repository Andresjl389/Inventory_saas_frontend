"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { PartnerInput } from "@/features/partners/schemas/partner.schema";
import { useCompanyId } from "@/stores/tenant.store";

import { suppliersApi } from "../api/suppliers.api";
import { supplierKeys } from "../api/suppliers.keys";

function useInvalidate() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: supplierKeys.all(companyId) });
}

export function useCreateSupplier() {
  const invalidate = useInvalidate();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: PartnerInput) => suppliersApi.create(input),
    onSuccess: async (partner) => {
      await invalidate();
      toast.success(`${partner.name} se creo correctamente`);
    },
  });
}

export function useUpdateSupplier() {
  const invalidate = useInvalidate();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ id, input }: { id: string; input: Partial<PartnerInput> }) =>
      suppliersApi.update(id, input),
    onSuccess: async (partner) => {
      await invalidate();
      toast.success(`${partner.name} se actualizo`);
    },
  });
}

export function useToggleSupplierActive() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? suppliersApi.deactivate(id) : suppliersApi.reactivate(id),
    onSuccess: async (partner) => {
      await invalidate();
      toast.success(
        partner.is_active ? `${partner.name} esta activo` : `${partner.name} se desactivo`,
      );
    },
  });
}
