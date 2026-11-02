import type { PaymentMethod } from "@/features/credit/types/credit.types";
import type { Money } from "@/lib/format";

export const SALE_STATUSES = ["DRAFT", "COMPLETED", "CANCELLED", "REFUNDED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  DRAFT: "Borrador",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
};

/** `SaleItemDTO` */
export type SaleItem = {
  id: string;
  product_id: string;
  quantity: Money;
  unit_price: Money;
  discount: Money;
  tax: Money;
  total: Money;
};

/** `SaleDTO` */
export type Sale = {
  id: string;
  company_id: string;
  customer_id: string | null;
  warehouse_id: string;
  status: SaleStatus;
  subtotal: Money;
  discount: Money;
  tax: Money;
  total: Money;
  notes: string | null;
  /** Como entro la plata que se pago en el momento. `CREDIT` = fiado. */
  payment_method: PaymentMethod;
  amount_paid: Money;
  /** Lo que queda a deber. Mayor que cero es una venta fiada. */
  outstanding: Money;
  created_by: string | null;
  items: SaleItem[];
  created_at: string;
  updated_at: string;
};

export type SaleFilters = {
  page: number;
  size: number;
  status?: SaleStatus | null;
  customer_id?: string | null;
  warehouse_id?: string | null;
};

export const DEFAULT_SALE_FILTERS: SaleFilters = {
  page: 1,
  size: 20,
  status: null,
  customer_id: null,
  warehouse_id: null,
};

/** Cuerpo de `POST /sales`. */
export type CreateSaleCommand = {
  warehouse_id: string;
  customer_id: string | null;
  items: {
    product_id: string;
    quantity: string;
    unit_price?: string;
    discount: string;
    tax: string;
  }[];
  notes: string | null;
  payment_method: PaymentMethod;
  /**
   * Omitido, un metodo de contado paga todo y `CREDIT` no paga nada. Menos
   * que el total deja saldo a deber, y eso exige cliente.
   */
  amount_paid?: string;
  /** `true` crea y completa en la misma transaccion: el caso del mostrador. */
  complete: boolean;
};
