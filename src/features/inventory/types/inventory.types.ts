/** Cantidades y dinero llegan como cadena: Pydantic serializa Decimal asi. */
export type Quantity = string | number;

/** `ProductStockDTO`: existencias de un producto en una bodega concreta. */
export type ProductStock = {
  id: string;
  company_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: Quantity;
  updated_at: string;
};

export const MOVEMENT_TYPES = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE: "Compra",
  SALE: "Venta",
  RETURN: "Devolucion",
  ADJUSTMENT: "Ajuste",
  TRANSFER_IN: "Traslado (entrada)",
  TRANSFER_OUT: "Traslado (salida)",
};

/**
 * Signo del movimiento, igual que `MovementType.direction` en el backend:
 * +1 suma stock, -1 lo resta, 0 significa que el signo lo lleva la cantidad.
 */
export const MOVEMENT_DIRECTION: Record<MovementType, 1 | -1 | 0> = {
  PURCHASE: 1,
  SALE: -1,
  RETURN: 1,
  ADJUSTMENT: 0,
  TRANSFER_IN: 1,
  TRANSFER_OUT: -1,
};

export const REFERENCE_TYPES = ["SALE", "PURCHASE", "TRANSFER", "MANUAL"] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  SALE: "Venta",
  PURCHASE: "Compra",
  TRANSFER: "Traslado",
  MANUAL: "Manual",
};

/** `StockMovementDTO`: la pista de auditoria del inventario. */
export type StockMovement = {
  id: string;
  company_id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: MovementType;
  quantity: Quantity;
  reference_type: ReferenceType;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type StockFilters = {
  page: number;
  size: number;
  product_id?: string | null;
  warehouse_id?: string | null;
  only_non_zero: boolean;
};

export const DEFAULT_STOCK_FILTERS: StockFilters = {
  page: 1,
  size: 20,
  product_id: null,
  warehouse_id: null,
  // Por defecto se ocultan las filas en cero: son ruido en un catalogo grande.
  only_non_zero: true,
};

export type MovementFilters = {
  page: number;
  size: number;
  product_id?: string | null;
  warehouse_id?: string | null;
  reference_id?: string | null;
};

export const DEFAULT_MOVEMENT_FILTERS: MovementFilters = {
  page: 1,
  size: 20,
  product_id: null,
  warehouse_id: null,
  reference_id: null,
};

/** `TransferResultDTO` */
export type TransferResult = {
  source: ProductStock;
  destination: ProductStock;
};
