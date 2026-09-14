import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { ProductInput } from "../schemas/product.schema";
import type { Product, ProductFilters } from "../types/product.types";

export const productsApi = {
  list: (filters: ProductFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<Product>>("/products", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        category_id: filters.category_id ?? undefined,
        is_active: filters.is_active,
      },
    }),

  get: (productId: string) => apiClient.get<Product>(`/products/${productId}`),

  create: (input: ProductInput) => apiClient.post<Product>("/products", input),

  update: (productId: string, input: Partial<ProductInput>) =>
    apiClient.patch<Product>(`/products/${productId}`, input),

  /** Borrado logico: el backend lo marca inactivo y devuelve el producto. */
  deactivate: (productId: string) => apiClient.delete<Product>(`/products/${productId}`),

  reactivate: (productId: string) =>
    apiClient.patch<Product>(`/products/${productId}`, { is_active: true }),
};
