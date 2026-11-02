import { z } from "zod";

import { MAX_DECIMAL, decimalField } from "@/lib/schema";

/**
 * Ajuste manual de existencias.
 *
 * `quantity_delta` lleva signo: negativo da de baja (rotura, merma) y positivo
 * suma (un recuento que encontro mas de lo que el sistema creia). Cero no
 * tiene sentido y el formulario lo rechaza antes de llegar al backend.
 */
export const adjustStockSchema = z.object({
  product_id: z.uuid("Elige un producto"),
  warehouse_id: z.uuid("Elige una bodega"),
  quantity_delta: decimalField({
    min: -MAX_DECIMAL,
    nonZero: true,
    minMessage: "Valor demasiado bajo",
  }),
  notes: z
    .string()
    .trim()
    .max(500, "Maximo 500 caracteres")
    .optional()
    .transform((value) => value || null),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type AdjustStockFormValues = z.input<typeof adjustStockSchema>;

/**
 * Lo que rellena el usuario. Pedir un numero con signo es una invitacion a
 * equivocarse, asi que el formulario pregunta la direccion por separado y el
 * signo se calcula al enviar.
 */
export const adjustStockFormSchema = z.object({
  product_id: z.uuid("Elige un producto"),
  warehouse_id: z.uuid("Elige una bodega"),
  direction: z.enum(["in", "out"]),
  quantity: decimalField({ nonZero: true }),
  notes: z
    .string()
    .trim()
    .max(500, "Maximo 500 caracteres")
    .optional()
    .transform((value) => value || null),
});

export type AdjustStockFormInput = z.infer<typeof adjustStockFormSchema>;
export type AdjustStockFormFields = z.input<typeof adjustStockFormSchema>;

/** Traduce el formulario al comando con signo que espera el backend. */
export function toAdjustCommand(values: AdjustStockFormInput): AdjustStockInput {
  return {
    product_id: values.product_id,
    warehouse_id: values.warehouse_id,
    quantity_delta: values.direction === "out" ? `-${values.quantity}` : values.quantity,
    notes: values.notes,
  };
}

export const transferStockSchema = z
  .object({
    product_id: z.uuid("Elige un producto"),
    source_warehouse_id: z.uuid("Elige la bodega de origen"),
    destination_warehouse_id: z.uuid("Elige la bodega de destino"),
    quantity: decimalField({ nonZero: true }),
    notes: z
      .string()
      .trim()
      .max(500, "Maximo 500 caracteres")
      .optional()
      .transform((value) => value || null),
  })
  .refine((data) => data.source_warehouse_id !== data.destination_warehouse_id, {
    path: ["destination_warehouse_id"],
    message: "El destino debe ser una bodega distinta",
  });

export type TransferStockInput = z.infer<typeof transferStockSchema>;
export type TransferStockFormValues = z.input<typeof transferStockSchema>;
