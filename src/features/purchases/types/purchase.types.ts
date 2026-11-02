import type { Money } from "@/lib/format";

/** Las compras no se reembolsan: se cancelan. */
export const PURCHASE_STATUSES = ["DRAFT", "COMPLETED", "CANCELLED"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT: "Borrador",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

/** `PurchaseItemDTO` */
export type PurchaseItem = {
  id: string;
  product_id: string;
  quantity: Money;
  unit_cost: Money;
  discount: Money;
  tax: Money;
  total: Money;
};

/** `PurchaseDTO` */
export type Purchase = {
  id: string;
  company_id: string;
  supplier_id: string | null;
  warehouse_id: string;
  status: PurchaseStatus;
  subtotal: Money;
  discount: Money;
  tax: Money;
  total: Money;
  notes: string | null;
  created_by: string | null;
  items: PurchaseItem[];
  created_at: string;
  updated_at: string;
};

export type PurchaseFilters = {
  page: number;
  size: number;
  status?: PurchaseStatus | null;
  supplier_id?: string | null;
  warehouse_id?: string | null;
};

export const DEFAULT_PURCHASE_FILTERS: PurchaseFilters = {
  page: 1,
  size: 20,
  status: null,
  supplier_id: null,
  warehouse_id: null,
};

/** Cuerpo de `POST /purchases`. */
export type CreatePurchaseCommand = {
  warehouse_id: string;
  supplier_id: string | null;
  items: {
    product_id: string;
    quantity: string;
    unit_cost: string;
    discount: string;
    tax: string;
  }[];
  notes: string | null;
  complete: boolean;
  /**
   * Al completar, refresca el `cost_price` de cada producto con lo que
   * realmente se pago. Apagado por defecto: muchos negocios prefieren un
   * promedio ponderado antes que el ultimo coste, y eso es una decision.
   */
  update_product_costs: boolean;
};
