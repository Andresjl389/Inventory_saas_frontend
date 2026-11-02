import type { ProductFilters } from "../types/product.types";

/** Toda clave de producto empieza por el tenant: ver seccion 15 de FRONTEND.md. */
export const productKeys = {
  all: (companyId: string) => ["products", companyId] as const,
  lists: (companyId: string) => [...productKeys.all(companyId), "list"] as const,
  list: (companyId: string, filters: ProductFilters) =>
    [...productKeys.lists(companyId), filters] as const,
  detail: (companyId: string, productId: string) =>
    [...productKeys.all(companyId), "detail", productId] as const,
  /** Mapa id -> producto para listados que solo devuelven ids. */
  directory: (companyId: string) => [...productKeys.all(companyId), "directory"] as const,
  /** Contadores del panel: consultas con `size=1` que solo leen `total`. */
  count: (companyId: string, scope: string) =>
    [...productKeys.all(companyId), "count", scope] as const,
};
