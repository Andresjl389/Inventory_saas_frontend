import { z } from "zod";

import { DOCUMENT_TYPES } from "@/config/documents";
import { decimalField } from "@/lib/schema";

import { SUBSCRIPTION_STATUSES } from "../types/platform.types";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximo ${max} caracteres`)
    .optional()
    .transform((value) => value || null);

const optionalEmail = z
  .union([z.literal(""), z.email("Correo invalido")])
  .optional()
  .transform((value) => value || null);

export const NO_DOCUMENT_TYPE = "none";

const optionalDocumentType = z
  .string()
  .optional()
  .transform((value) => (!value || value === NO_DOCUMENT_TYPE ? null : value))
  .pipe(z.enum(DOCUMENT_TYPES).nullable());

/** Sin plan: el centinela del `<Select>`, que no admite "". */
export const NO_PLAN = "none";

/**
 * Alta de empresa desde plataforma.
 *
 * Si el correo del propietario ya existe, esa cuenta pasa a ser el dueno; si
 * no, se crea, y entonces la contrasena es obligatoria. Esa regla vive en el
 * backend, pero validarla aqui evita un viaje de ida y vuelta.
 */
export const provisionCompanySchema = z
  .object({
    name: z.string().trim().min(1, "Escribe el nombre de la empresa").max(200),
    owner_email: z.email("Escribe un correo valido"),
    owner_exists: z.boolean().default(false),
    owner_password: z
      .string()
      .optional()
      .transform((value) => value || null),
    owner_first_name: optionalText(100),
    owner_last_name: optionalText(100),
    legal_name: optionalText(200),
    document_type: optionalDocumentType,
    document_number: optionalText(50),
    email: optionalEmail,
    phone: optionalText(50),
    plan_code: z
      .string()
      .optional()
      .transform((value) => (!value || value === NO_PLAN ? null : value)),
  })
  .refine(
    (data) => data.owner_exists || (data.owner_password?.length ?? 0) >= 8,
    {
      path: ["owner_password"],
      message: "Minimo 8 caracteres para una cuenta nueva",
    },
  );

export type ProvisionCompanyInput = Omit<
  z.infer<typeof provisionCompanySchema>,
  "owner_exists"
> & { owner_exists?: boolean };
export type ProvisionCompanyFormValues = z.input<typeof provisionCompanySchema>;

export const updateCompanySchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre").max(200),
  legal_name: optionalText(200),
  document_type: optionalDocumentType,
  document_number: optionalText(50),
  email: optionalEmail,
  phone: optionalText(50),
});

export type UpdateCompanyInput = Partial<z.infer<typeof updateCompanySchema>> & {
  status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
};
export type UpdateCompanyFormValues = z.input<typeof updateCompanySchema>;

export const userSchema = z.object({
  email: z.email("Escribe un correo valido"),
  password: z.string().min(8, "Minimo 8 caracteres").max(72, "Maximo 72 caracteres"),
  first_name: z.string().trim().min(1, "Escribe el nombre").max(100),
  last_name: z.string().trim().min(1, "Escribe el apellido").max(100),
  is_superuser: z.boolean().default(false),
});

export type UserInput = z.infer<typeof userSchema>;
export type UserFormValues = z.input<typeof userSchema>;

export const updateUserSchema = z.object({
  first_name: z.string().trim().min(1, "Escribe el nombre").max(100),
  last_name: z.string().trim().min(1, "Escribe el apellido").max(100),
  /** Vacio significa "no cambiar la contrasena". */
  password: z
    .string()
    .optional()
    .refine((value) => !value || (value.length >= 8 && value.length <= 72), {
      message: "Entre 8 y 72 caracteres",
    })
    .transform((value) => value || undefined),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserFormValues = z.input<typeof updateUserSchema>;

/** Un limite en 0 significa "sin limite": asi lo interpreta el backend. */
const limitField = z.coerce
  .number({ message: "Escribe un numero" })
  .int("Tiene que ser un numero entero")
  .min(0, "No puede ser negativo");

export const planSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Minimo 2 caracteres")
    .max(64)
    .transform((value) => value.toUpperCase().replace(/\s+/g, "_")),
  name: z.string().trim().min(1, "Escribe el nombre del plan").max(100),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  price_monthly: decimalField(),
  max_users: limitField,
  max_products: limitField,
  max_warehouses: limitField,
});

export type PlanInput = z.infer<typeof planSchema>;
export type PlanFormValues = z.input<typeof planSchema>;

export const updatePlanSchema = planSchema.omit({ code: true }).extend({
  is_active: z.boolean(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type UpdatePlanFormValues = z.input<typeof updatePlanSchema>;

export const assignSubscriptionSchema = z.object({
  plan_code: z.string().trim().min(1, "Elige un plan").max(64),
  status: z.enum(SUBSCRIPTION_STATUSES),
  period_days: z.coerce
    .number({ message: "Escribe un numero" })
    .int()
    .min(1, "Minimo 1 dia")
    .max(3650, "Maximo 3650 dias"),
});

export type AssignSubscriptionInput = z.infer<typeof assignSubscriptionSchema>;
export type AssignSubscriptionFormValues = z.input<typeof assignSubscriptionSchema>;
