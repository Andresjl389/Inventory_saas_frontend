import { z } from "zod";

import { decimalField } from "@/lib/schema";

/** Valor que usa el `<Select>` para "sin categoria" (Radix no admite ""). */
export const NO_CATEGORY = "none";

/** Precio con la escala que espera el backend (Decimal de 4 decimales). */
const priceField = decimalField();

export const productSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del producto").max(200),
  sku: z.string().trim().min(1, "El SKU es obligatorio").max(64),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  barcode: z
    .string()
    .trim()
    .max(64, "Maximo 64 caracteres")
    .optional()
    .transform((value) => value || null),
  category_id: z
    .string()
    .optional()
    .transform((value) => (!value || value === NO_CATEGORY ? null : value)),
  cost_price: priceField,
  sale_price: priceField,
  min_stock: decimalField(),
});

/** Lo que se envia al backend. */
export type ProductInput = z.infer<typeof productSchema>;
/** Lo que maneja el formulario (todo cadenas). */
export type ProductFormValues = z.input<typeof productSchema>;
