"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { productKeys } from "@/features/products/api/products.keys";
import { useCompanyId } from "@/stores/tenant.store";

import { categoriesApi } from "../api/categories.api";
import { categoryKeys } from "../api/categories.keys";
import type { CategoryInput } from "../schemas/category.schema";

function useInvalidateCategories() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: categoryKeys.all(companyId) });
    // Las tablas de productos muestran el nombre de la categoria.
    await queryClient.invalidateQueries({ queryKey: productKeys.all(companyId) });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: CategoryInput) => categoriesApi.create(input),
    onSuccess: async (category) => {
      await invalidate();
      toast.success(`Categoria ${category.name} creada`);
    },
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ categoryId, input }: { categoryId: string; input: CategoryInput }) =>
      categoriesApi.update(categoryId, input),
    onSuccess: async (category) => {
      await invalidate();
      toast.success(`Categoria ${category.name} actualizada`);
    },
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: (categoryId: string) => categoriesApi.remove(categoryId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Categoria eliminada");
    },
  });
}
