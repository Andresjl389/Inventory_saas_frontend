"use client";

import { useQueries } from "@tanstack/react-query";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { productsApi } from "@/features/products/api/products.api";
import { productKeys } from "@/features/products/api/products.keys";
import { useCompanyId } from "@/stores/tenant.store";

/** Tope de consultas paralelas: una por categoria. */
const MAX_CATEGORIES = 8;

/**
 * Productos por categoria.
 *
 * Cuenta en el servidor (`size=1`, se lee solo `total`) en vez de descargar el
 * catalogo. Hace una peticion por categoria, por eso el tope: en cuanto el
 * backend exponga un endpoint de metricas, esto se sustituye por una sola
 * llamada.
 */
export function useCategoryBreakdown() {
  const companyId = useCompanyId();
  const categories = useCategories();
  const visible = (categories.data ?? []).slice(0, MAX_CATEGORIES);

  const results = useQueries({
    queries: visible.map((category) => ({
      queryKey: productKeys.count(companyId, `category:${category.id}`),
      queryFn: async () => {
        const page = await productsApi.list({ page: 1, size: 1, category_id: category.id });
        return page.total;
      },
      staleTime: 60_000,
    })),
  });

  return {
    isPending: categories.isPending || results.some((result) => result.isPending),
    error: categories.error ?? results.find((result) => result.error)?.error ?? null,
    truncated: (categories.data?.length ?? 0) > MAX_CATEGORIES,
    items: visible.map((category, index) => ({
      id: category.id,
      name: category.name,
      total: results[index]?.data ?? 0,
    })),
  };
}
