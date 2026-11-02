import type { Money } from "@/lib/format";

/** `SalesSummaryDTO`: solo cuentan las ventas COMPLETED. */
export type SalesSummary = {
  sales_count: number;
  revenue: Money;
  discount: Money;
  tax: Money;
  average_ticket: Money;
};

/** `ProductSalesDTO` */
export type ProductSales = {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: Money;
  revenue: Money;
};

/** `SalesReportDTO` */
export type SalesReport = {
  since: string | null;
  until: string | null;
  summary: SalesSummary;
  top_products: ProductSales[];
};

/** `WarehouseValuationDTO` */
export type WarehouseValuation = {
  warehouse_id: string;
  warehouse_name: string;
  units: Money;
  cost_value: Money;
  retail_value: Money;
};

/** `InventoryValuationDTO`: lo que vale el stock, a coste y a precio de venta. */
export type InventoryValuation = {
  warehouses: WarehouseValuation[];
  total_units: Money;
  total_cost_value: Money;
  total_retail_value: Money;
};

/** `LowStockRowDTO`. Trae los nombres resueltos: no hace falta diccionario. */
export type LowStockRow = {
  product_id: string;
  product_name: string;
  sku: string;
  warehouse_id: string | null;
  warehouse_name: string | null;
  quantity: Money;
  min_stock: Money;
};

/** `LowStockReportDTO` */
export type LowStockReport = {
  items: LowStockRow[];
  total: number;
};

/** Rangos de fecha que ofrece el informe de ventas. */
export const SALES_RANGES = [
  { value: "7", label: "Ultimos 7 dias" },
  { value: "30", label: "Ultimos 30 dias" },
  { value: "90", label: "Ultimos 90 dias" },
  { value: "all", label: "Todo el historico" },
] as const;

export type SalesRange = (typeof SALES_RANGES)[number]["value"];

/** Convierte el rango en el `since` que espera la API. */
export function rangeToSince(range: SalesRange): string | undefined {
  if (range === "all") return undefined;
  const days = Number(range);
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since.toISOString();
}
