"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCompanyId } from "@/stores/tenant.store";

import { productsApi } from "../api/products.api";
import { productKeys } from "../api/products.keys";
import type { ProductInput } from "../schemas/product.schema";

/** Cualquier escritura invalida listas y contadores del tenant actual. */
function useInvalidateProducts() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: productKeys.all(companyId) });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: ProductInput) => productsApi.create(input),
    onSuccess: async (product) => {
      await invalidate();
      toast.success(`${product.name} se creo correctamente`);
    },
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ productId, input }: { productId: string; input: Partial<ProductInput> }) =>
      productsApi.update(productId, input),
    onSuccess: async (product) => {
      await invalidate();
      toast.success(`${product.name} se actualizo`);
    },
  });
}

export function useToggleProductActive() {
  const invalidate = useInvalidateProducts();

  return useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      isActive ? productsApi.deactivate(productId) : productsApi.reactivate(productId),
    onSuccess: async (product) => {
      await invalidate();
      toast.success(
        product.is_active ? `${product.name} esta activo` : `${product.name} se desactivo`,
      );
    },
  });
}
