"use client";

import { useMutation } from "@tanstack/react-query";

import { authApi } from "../api/auth.api";

export function useLogout() {
  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: () => authApi.logout(),
    // Aunque falle la llamada al backend, las cookies ya se borraron.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa deliberada: hay que descartar toda la cache del cliente
    onSettled: () => window.location.assign("/login"),
  });
}
