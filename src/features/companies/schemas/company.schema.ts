import { z } from "zod";

import { COMPANY_ROLES } from "@/config/permissions";
import { DOCUMENT_TYPES } from "../types/company.types";

/**
 * El backend acepta `null` en los opcionales pero rechaza `""` en los campos
 * con formato (EmailStr). Por eso todo campo vacio se normaliza a `null`.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximo ${max} caracteres`)
    .optional()
    .transform((value) => value || null);

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre de la empresa").max(200),
  legal_name: optionalText(200),
  document_type: z
    .enum(DOCUMENT_TYPES)
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  document_number: optionalText(50),
  email: z
    .union([z.literal(""), z.email("Correo invalido")])
    .optional()
    .transform((value) => value || null),
  phone: optionalText(50),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateCompanyFormValues = z.input<typeof createCompanySchema>;

export const addMemberSchema = z.object({
  email: z.email("Escribe un correo valido"),
  role: z.enum(COMPANY_ROLES, { message: "Elige un rol" }),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
