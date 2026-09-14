"use client";

import { useQuery } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { productsApi } from "../api/products.api";
import { productKeys } from "../api/products.keys";

/**
 * Contador de productos para el panel.
 *
 * Pide `size=1` y solo lee `total`: el conteo lo hace PostgreSQL. Descargar el
 * catalogo entero para contarlo en el navegador no escala (seccion 28).
 */
export function useProductCount(scope: "all" | "active" | "inactive") {
  const companyId = useCompanyId();
  const isActive = scope === "all" ? undefined : scope === "active";

  return useQuery({
    queryKey: productKeys.count(companyId, scope),
    queryFn: async () => {
      const page = await productsApi.list({ page: 1, size: 1, is_active: isActive });
      return page.total;
    },
    staleTime: 60_000,
  });
}
