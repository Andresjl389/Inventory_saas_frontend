"use client";

import { useMutation } from "@tanstack/react-query";

import { authApi } from "../api/auth.api";
import type { RegisterInput } from "../schemas/auth.schema";

export function useRegister() {
  return useMutation({
    mutationKey: ["auth", "register"],
    meta: { silent: true },
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: ({ companyId, requiresLogin }) => {
      if (requiresLogin) {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa deliberada: las cookies de sesion acaban de cambiar
        window.location.assign("/login");
        return;
      }
   
      window.location.assign(companyId ? "/dashboard" : "/select-company");
    },
  });
}
