"use client";

import { useMutation } from "@tanstack/react-query";

import { companiesApi } from "../api/companies.api";

/**
 * Cambiar de empresa recarga la aplicacion entera.
 *
 * Es deliberado: invalidar las queries del tenant anterior una a una deja
 * hueco para que algo pinte datos de la empresa equivocada mientras llega la
 * respuesta. Una navegacion completa garantiza que no sobrevive ninguna cache.
 */
export function useSwitchCompany() {
  return useMutation({
    mutationFn: (companyId: string) => companiesApi.setActive(companyId),
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ver comentario de arriba: cambiar de tenant obliga a recargar
    onSuccess: () => window.location.assign("/dashboard"),
  });
}
