"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { PartnerInput } from "@/features/partners/schemas/partner.schema";
import { useCompanyId } from "@/stores/tenant.store";

import { customersApi } from "../api/customers.api";
import { customerKeys } from "../api/customers.keys";

function useInvalidate() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: customerKeys.all(companyId) });
}

export function useCreateCustomer() {
  const invalidate = useInvalidate();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: PartnerInput) => customersApi.create(input),
    onSuccess: async (partner) => {
      await invalidate();
      toast.success(`${partner.name} se creo correctamente`);
    },
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ id, input }: { id: string; input: Partial<PartnerInput> }) =>
      customersApi.update(id, input),
    onSuccess: async (partner) => {
      await invalidate();
      toast.success(`${partner.name} se actualizo`);
    },
  });
}

export function useToggleCustomerActive() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? customersApi.deactivate(id) : customersApi.reactivate(id),
    onSuccess: async (partner) => {
      await invalidate();
      toast.success(
        partner.is_active ? `${partner.name} esta activo` : `${partner.name} se desactivo`,
      );
    },
  });
}
