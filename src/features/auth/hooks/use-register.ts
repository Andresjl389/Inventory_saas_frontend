"use client";

import { useMutation } from "@tanstack/react-query";

import { authApi } from "../api/auth.api";
import type { RegisterInput } from "../schemas/auth.schema";

export function useRegister() {
  return useMutation({
    mutationKey: ["auth", "register"],
    meta: { silent: true },
    mutationFn: (input: RegisterInput) => authApi.register(input),
    // Una cuenta nueva no pertenece a ninguna empresa, asi que siempre cae en
    // el selector, que en ese caso explica que hay que pedir acceso.
    onSuccess: ({ requiresLogin }) => {
      // Recarga completa deliberada: las cookies de sesion acaban de cambiar.
      window.location.assign(requiresLogin ? "/login" : "/select-company");
    },
  });
}
