import { apiClient, nextApi } from "@/lib/api/client";

import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import type { User } from "../types/auth.types";

/**
 * Login, registro y logout pasan por rutas propias de Next porque son las
 * unicas que pueden escribir las cookies httpOnly con los tokens. El resto de
 * la app usa el proxy `/api/bff`.
 */
export const authApi = {
  login: (input: LoginInput) =>
    nextApi.post<{ companyId: string | null }>("/auth/login", input),

  /**
   * Crea una cuenta, nada mas: las empresas las crea el super administrador.
   * `confirmPassword` solo existe en el formulario y no se envia.
   */
  register: (input: RegisterInput) =>
    nextApi.post<{ requiresLogin: boolean }>("/auth/register", {
      email: input.email,
      password: input.password,
      first_name: input.first_name,
      last_name: input.last_name,
    }),

  logout: () => nextApi.post<{ ok: true }>("/auth/logout"),

  me: () => apiClient.get<User>("/auth/me"),
};
