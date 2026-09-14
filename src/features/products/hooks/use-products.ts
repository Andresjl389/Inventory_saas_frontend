"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { productsApi } from "../api/products.api";
import { productKeys } from "../api/products.keys";
import type { ProductFilters } from "../types/product.types";

export function useProducts(filters: ProductFilters) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: productKeys.list(companyId, filters),
    queryFn: ({ signal }) => productsApi.list(filters, signal),
    // Al paginar o buscar se mantiene la tabla anterior en pantalla en vez de
    // parpadear a un esqueleto.
    placeholderData: keepPreviousData,
  });
}
