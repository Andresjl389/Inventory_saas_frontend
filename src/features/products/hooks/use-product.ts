"use client";

import { useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { productsApi } from "../api/products.api";
import { productKeys } from "../api/products.keys";

export function useProduct(productId: string | null) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: productKeys.detail(companyId, productId ?? ""),
    queryFn: () => productsApi.get(productId as string),
    enabled: Boolean(productId),
  });
}
