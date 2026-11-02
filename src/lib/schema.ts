import { z } from "zod";

/** `NUMERIC(18,4)` en la base: 14 enteros + 4 decimales. */
export const MAX_DECIMAL = 99_999_999_999_999;

/**
 * Campo decimal para dinero y cantidades.
 *
 * El usuario escribe "1.234,50" o "1234.5"; el backend espera un Decimal de
 * como mucho 4 decimales. Se envia como cadena para no perder precision al
 * pasar por un `number` de JavaScript, que es justo el error clasico al
 * manejar importes.
 */
export function decimalField(
  options: {
    min?: number;
    max?: number;
    nonZero?: boolean;
    invalidMessage?: string;
    minMessage?: string;
  } = {},
) {
  const {
    min = 0,
    max = MAX_DECIMAL,
    nonZero = false,
    invalidMessage = "Escribe un numero valido",
    minMessage = min === 0 ? "No puede ser negativo" : `Minimo ${min}`,
  } = options;

  return z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "number") return value;
      const normalized = value.replace(/\s/g, "").replace(",", ".");
      return normalized === "" ? Number.NaN : Number(normalized);
    })
    .refine((value) => Number.isFinite(value), invalidMessage)
    .refine((value) => value >= min, minMessage)
    .refine((value) => value <= max, "Valor demasiado alto")
    .refine((value) => !nonZero || value !== 0, "No puede ser cero")
    .transform((value) => value.toFixed(4));
}
