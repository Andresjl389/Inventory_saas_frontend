import { z } from "zod";

import { decimalField } from "@/lib/schema";

import { ABONO_METHODS, type AdjustAccountCommand } from "../types/credit.types";

/**
 * Un abono. El backend rechaza uno mayor que la deuda
 * (`PAYMENT_EXCEEDS_BALANCE`); el formulario lo comprueba antes con el saldo
 * que ya tiene en pantalla, porque casi siempre es 50000 por 5000.
 */
export function paymentSchema(owes: number) {
  return z.object({
    amount: decimalField({ nonZero: true }).refine(
      (value) => Number(value) <= owes,
      "Es mas de lo que debe",
    ),
    method: z.enum(ABONO_METHODS),
    notes: z
      .string()
      .trim()
      .max(500, "Maximo 500 caracteres")
      .optional()
      .transform((value) => value || null),
  });
}

export type PaymentInput = z.infer<ReturnType<typeof paymentSchema>>;
export type PaymentFormValues = z.input<ReturnType<typeof paymentSchema>>;

/**
 * Ajuste manual: un perdon de deuda o una correccion del cuaderno viejo.
 *
 * Igual que en el ajuste de stock, pedir un numero con signo es invitar al
 * error: se pregunta si la deuda sube o baja y el signo se calcula al enviar.
 * La nota es obligatoria porque un ajuste sin explicacion es justo lo que
 * vuelve turbias las cuentas.
 */
export const adjustAccountFormSchema = z.object({
  direction: z.enum(["decrease", "increase"]),
  amount: decimalField({ nonZero: true }),
  notes: z
    .string()
    .trim()
    .min(3, "Explica el ajuste (minimo 3 caracteres)")
    .max(500, "Maximo 500 caracteres"),
});

export type AdjustAccountFormInput = z.infer<typeof adjustAccountFormSchema>;
export type AdjustAccountFormFields = z.input<typeof adjustAccountFormSchema>;

/** Negativo baja la deuda, positivo la sube. */
export function toAdjustAccountCommand(values: AdjustAccountFormInput): AdjustAccountCommand {
  return {
    amount: values.direction === "decrease" ? `-${values.amount}` : values.amount,
    notes: values.notes,
  };
}
