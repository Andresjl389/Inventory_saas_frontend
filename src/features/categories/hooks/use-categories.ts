"use client";

import { useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { categoriesApi } from "../api/categories.api";
import { categoryKeys } from "../api/categories.keys";

export function useCategories() {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: categoryKeys.list(companyId),
    queryFn: () => categoriesApi.list(),
    // Cambian poco y casi todas las vistas de producto las necesitan.
    staleTime: 5 * 60_000,
  });
}
