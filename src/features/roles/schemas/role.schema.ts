import { z } from "zod";

export const roleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Minimo 2 caracteres")
    .max(64, "Maximo 64 caracteres")
    // Se normaliza a mayusculas para que case con los del sistema (OWNER, ADMIN...).
    .transform((value) => value.toUpperCase().replace(/\s+/g, "_")),
  name: z.string().trim().min(1, "Escribe el nombre del rol").max(100),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  permissions: z.array(z.string()).default([]),
});

export type RoleInput = z.infer<typeof roleSchema>;
export type RoleFormValues = z.input<typeof roleSchema>;

/** Al editar, el codigo no se toca: es la clave con la que se asigna el rol. */
export const updateRoleSchema = roleSchema.omit({ code: true });

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
