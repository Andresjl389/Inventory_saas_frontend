import { z } from "zod";

import { DOCUMENT_TYPES } from "@/config/documents";
import { decimalField } from "@/lib/schema";

/** Sin tipo de documento seleccionado (Radix Select no admite ""). */
export const NO_DOCUMENT_TYPE = "none";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximo ${max} caracteres`)
    .optional()
    .transform((value) => value || null);

/**
 * El backend acepta `null` en los opcionales pero rechaza `""` en los campos
 * con formato (EmailStr), asi que todo campo vacio se normaliza a `null`.
 */
export const partnerSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre").max(200),
  document_type: z
    .string()
    .optional()
    .transform((value) => (!value || value === NO_DOCUMENT_TYPE ? null : value))
    .pipe(z.enum(DOCUMENT_TYPES).nullable()),
  document_number: optionalText(50),
  email: z
    .union([z.literal(""), z.email("Correo invalido")])
    .optional()
    .transform((value) => value || null),
  phone: optionalText(50),
  address: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  /**
   * Solo clientes: el cupo de fiado, 0 = sin tope. En proveedores el campo no
   * se pinta, queda `undefined` y no viaja.
   */
  credit_limit: decimalField().optional(),
});

export type PartnerInput = z.infer<typeof partnerSchema>;
export type PartnerFormValues = z.input<typeof partnerSchema>;
