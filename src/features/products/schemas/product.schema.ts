import { z } from "zod";

/** Valor que usa el `<Select>` para "sin categoria" (Radix no admite ""). */
export const NO_CATEGORY = "none";

/**
 * Precio: el usuario escribe "1.234,50" o "1234.5"; el backend espera un
 * Decimal con 4 decimales como maximo. Se envia como cadena para no perder
 * precision al pasar por un `number` de JavaScript.
 */
const MAX_PRICE = 99_999_999_999_999;

const priceField = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "number") return value;
    // "1.234,50" y "1234.5" son la misma cifra para quien la escribe.
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    return normalized === "" ? Number.NaN : Number(normalized);
  })
  .refine((value) => Number.isFinite(value), "Escribe un numero valido")
  .refine((value) => value >= 0, "No puede ser negativo")
  .refine((value) => value <= MAX_PRICE, "Valor demasiado alto")
  .transform((value) => value.toFixed(4));

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
});

/** Lo que se envia al backend. */
export type ProductInput = z.infer<typeof productSchema>;
/** Lo que maneja el formulario (todo cadenas). */
export type ProductFormValues = z.input<typeof productSchema>;
