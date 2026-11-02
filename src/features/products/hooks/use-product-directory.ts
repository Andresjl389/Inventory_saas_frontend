"use client";

import { useQuery } from "@tanstack/react-query";

import { appConfig } from "@/config/env";
import { useCompanyId } from "@/stores/tenant.store";

import { productsApi } from "../api/products.api";
import { productKeys } from "../api/products.keys";
import type { Product } from "../types/product.types";

/**
 * Diccionario id -> producto.
 *
 * Hace falta porque `ProductStockDTO` y las lineas de venta y compra solo
 * traen `product_id`, sin nombre ni SKU. Se resuelve con una consulta de una
 * pagina (el tope del backend son 100 registros), asi que por encima de 100
 * productos el diccionario queda incompleto y `truncated` lo avisa.
 *
 * Lo correcto a medio plazo es que el backend incluya `product_name` y
 * `product_sku` en esas respuestas; cuando lo haga, este hook sobra.
 */
export function useProductDirectory() {
  const companyId = useCompanyId();

  const query = useQuery({
    queryKey: productKeys.directory(companyId),
    queryFn: async () => {
      const page = await productsApi.list({ page: 1, size: appConfig.maxPageSize });
      return {
        byId: new Map(page.items.map((product) => [product.id, product])),
        total: page.total,
        truncated: page.total > page.items.length,
      };
    },
    staleTime: 5 * 60_000,
  });

  const lookup = (productId: string): Product | undefined => query.data?.byId.get(productId);

  return {
    ...query,
    lookup,
    truncated: query.data?.truncated ?? false,
  };
}
