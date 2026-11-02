import { z } from "zod";

/**
 * Las empresas ya no se crean desde la aplicacion: el super administrador las
 * da de alta junto con su propietario. Aqui solo queda la gestion de miembros.
 */

/**
 * `role` es un **codigo** de rol, no un enum: puede ser uno del sistema o uno
 * propio de la empresa. La lista sale de `GET /roles`.
 *
 * Si el correo no tiene cuenta todavia, el backend responde
 * `ACCOUNT_DETAILS_REQUIRED` y hay que repetir la llamada con contrasena,
 * nombre y apellido: la crea en el mismo paso.
 */
export const addMemberSchema = z
  .object({
    email: z.email("Escribe un correo valido"),
    role: z.string().trim().min(1, "Elige un rol").max(64),
    withAccount: z.boolean().default(false),
    password: z.string().max(72).optional(),
    first_name: z.string().trim().max(100).optional(),
    last_name: z.string().trim().max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.withAccount) return;

    if (!value.password || value.password.length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Minimo 8 caracteres",
      });
    }
    if (!value.first_name) {
      ctx.addIssue({ code: "custom", path: ["first_name"], message: "Escribe el nombre" });
    }
    if (!value.last_name) {
      ctx.addIssue({ code: "custom", path: ["last_name"], message: "Escribe el apellido" });
    }
  });

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type AddMemberFormValues = z.input<typeof addMemberSchema>;

export const changeMemberRoleSchema = z.object({
  role: z.string().trim().min(1, "Elige un rol").max(64),
  is_active: z.boolean().optional(),
});

export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
