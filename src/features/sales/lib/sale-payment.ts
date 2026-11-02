import type { PaymentMethod } from "@/features/credit/types/credit.types";

export type SalePaymentPreview = {
  /** Lo que se paga ahora, ya resuelto. */
  amountPaid: number;
  /** Lo que queda a deber. Mayor que cero es una venta fiada. */
  outstanding: number;
  /**
   * Lo que viaja en `amount_paid`. `undefined` deja que el backend aplique su
   * regla por defecto, que es la misma que se previsualiza aqui.
   */
  amountPaidField: string | undefined;
  problems: string[];
};

/**
 * Vista previa del pago de una venta, con la regla de `Sale.settle()`:
 *
 * - Sin monto, un metodo de contado paga todo y `CREDIT` no paga nada.
 * - Con monto, lo que falte queda a deber, sea cual sea el metodo: "paga 20
 *   mil en efectivo y el resto se lo fio".
 * - Dejar saldo exige cliente, y pagar de mas no existe.
 *
 * Es solo para mostrar y prevalidar: la cuenta que vale la rehace el backend
 * con Decimal, igual que los totales del carrito.
 */
export function salePaymentPreview({
  total,
  method,
  paidInput,
  hasCustomer,
}: {
  total: number;
  method: PaymentMethod;
  paidInput: string;
  hasCustomer: boolean;
}): SalePaymentPreview {
  const problems: string[] = [];
  const typed = paidInput.replace(/\s/g, "").replace(",", ".");

  let amountPaid: number;
  let amountPaidField: string | undefined;

  if (typed === "") {
    amountPaid = method === "CREDIT" ? 0 : total;
    amountPaidField = undefined;
  } else {
    const parsed = Number(typed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      problems.push("El monto pagado no es un numero valido.");
      amountPaid = 0;
      amountPaidField = undefined;
    } else {
      amountPaid = parsed;
      amountPaidField = parsed.toFixed(4);
    }
  }

  if (amountPaid > total) {
    problems.push("Lo pagado supera el total de la venta.");
  }

  const outstanding = Math.max(total - amountPaid, 0);
  if (outstanding > 0 && !hasCustomer) {
    problems.push("Para dejar saldo pendiente elige un cliente: no se le fia a nadie.");
  }

  return { amountPaid, outstanding, amountPaidField, problems };
}
