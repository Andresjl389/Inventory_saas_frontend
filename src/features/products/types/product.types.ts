import type { Money } from "@/lib/format";

/** `ProductDTO`. Los precios llegan como cadena: Pydantic serializa Decimal asi. */
export type Product = {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  cost_price: Money;
  sale_price: Money;
  /** Umbral de reposicion: por debajo, el producto sale en "bajo minimo". */
  min_stock: Money;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Filtros que acepta `GET /products`. Todo el filtrado ocurre en el servidor. */
export type ProductFilters = {
  page: number;
  size: number;
  search?: string;
  category_id?: string | null;
  /** `undefined` = todos, no "ninguno". */
  is_active?: boolean;
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  page: 1,
  size: 20,
  search: "",
  category_id: null,
  is_active: undefined,
};
