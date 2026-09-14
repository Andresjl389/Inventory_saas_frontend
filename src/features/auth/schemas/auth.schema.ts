import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Escribe un correo valido"),
  password: z.string().min(1, "Escribe tu contrasena"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: z.string().trim().min(1, "Escribe tu nombre").max(100),
    last_name: z.string().trim().min(1, "Escribe tu apellido").max(100),
    email: z.email("Escribe un correo valido"),
    // 72 bytes es el limite de bcrypt, y el backend lo valida igual.
    password: z
      .string()
      .min(8, "Minimo 8 caracteres")
      .max(72, "Maximo 72 caracteres"),
    confirmPassword: z.string(),
    company_name: z.string().trim().min(1, "Escribe el nombre de tu empresa").max(200),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
