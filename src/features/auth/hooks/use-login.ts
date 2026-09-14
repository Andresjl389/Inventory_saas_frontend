"use client";

import { useMutation } from "@tanstack/react-query";

import { authApi } from "../api/auth.api";
import type { LoginInput } from "../schemas/auth.schema";

/**
 * Tras iniciar sesion navegamos con una recarga completa en lugar de
 * `router.push`: las cookies acaban de cambiar y queremos que el middleware y
 * los Server Components arranquen desde cero, sin cache del router.
 */
export function useLogin(next?: string) {
  return useMutation({
    mutationKey: ["auth", "login"],
    meta: { silent: true },
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: ({ companyId }) => {
      const target = companyId ? (next ?? "/dashboard") : "/select-company";

      window.location.assign(target);
    },
  });
}
