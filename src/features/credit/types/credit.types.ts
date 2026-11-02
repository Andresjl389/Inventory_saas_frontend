import type { StatusTone } from "@/components/shared/status-badge";
import type { Money } from "@/lib/format";

/**
 * Como entro la plata. `CREDIT` es fiado: no entra nada en el momento.
 * `PaymentMethod` en el backend; los abonos usan los dos primeros.
 */
export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CREDIT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CREDIT: "Fiado",
};

/** Un abono entra por caja o por transferencia; "fiar un abono" no existe. */
export const ABONO_METHODS = ["CASH", "TRANSFER"] as const;
export type AbonoMethod = (typeof ABONO_METHODS)[number];

export const ENTRY_TYPES = ["SALE", "PAYMENT", "SALE_REVERSED", "ADJUSTMENT"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  SALE: "Venta fiada",
  PAYMENT: "Abono",
  SALE_REVERSED: "Venta anulada",
  ADJUSTMENT: "Ajuste",
};

export const ENTRY_TYPE_TONES: Record<EntryType, StatusTone> = {
  SALE: "warning",
  PAYMENT: "success",
  SALE_REVERSED: "neutral",
  ADJUSTMENT: "info",
};

/** `AccountEntryDTO`. `amount` lleva signo: positivo debe mas, negativo menos. */
export type AccountEntry = {
  id: string;
  entry_type: EntryType;
  amount: Money;
  /** La venta que lo origino, cuando la hay. */
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

/**
 * `CustomerAccountDTO`: la cuenta de un cliente con su historial.
 *
 * `owes` e `in_favor` son las dos caras de `balance`, ya separadas, para que
 * la pantalla no tenga que razonar sobre signos.
 */
export type CustomerAccount = {
  customer_id: string;
  customer_name: string;
  phone: string | null;
  balance: Money;
  owes: Money;
  in_favor: Money;
  /** 0 = sin tope. */
  credit_limit: Money;
  /** `null` cuando no hay tope. */
  available_credit: Money | null;
  entries: AccountEntry[];
  total_entries: number;
  page: number;
  size: number;
  pages: number;
};

/** `AccountSummaryDTO`: una fila de la lista de cuentas. */
export type AccountSummary = {
  customer_id: string;
  customer_name: string;
  phone: string | null;
  balance: Money;
  credit_limit: Money;
  last_movement_at: string | null;
};

/** `CreditSummaryDTO`: el encabezado de "cuentas claras". */
export type CreditSummary = {
  customers_with_debt: number;
  total_receivable: Money;
};

export type AccountFilters = {
  page: number;
  size: number;
  search?: string;
  /** `false` incluye a los que estan al dia: sirve para elegir a quien fiarle. */
  only_with_balance: boolean;
};

export const DEFAULT_ACCOUNT_FILTERS: AccountFilters = {
  page: 1,
  size: 20,
  search: "",
  only_with_balance: true,
};

/** Cuerpo de `POST /credit/accounts/{id}/payments`. */
export type RegisterPaymentCommand = {
  amount: string;
  method: AbonoMethod;
  notes: string | null;
};

/** Cuerpo de `POST /credit/accounts/{id}/adjustments`. Con signo; `notes` obligatorio. */
export type AdjustAccountCommand = {
  amount: string;
  notes: string;
};
