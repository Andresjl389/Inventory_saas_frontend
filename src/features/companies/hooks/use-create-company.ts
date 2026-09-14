"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { companiesApi } from "../api/companies.api";
import { companyKeys } from "../api/companies.keys";
import type { CreateCompanyInput } from "../schemas/company.schema";

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: CreateCompanyInput) => companiesApi.create(input),
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.memberships() });
      // El usuario queda como OWNER: entrar directamente es lo esperado.
      await companiesApi.setActive(company.id);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa deliberada: las cookies de sesion acaban de cambiar
      window.location.assign("/dashboard");
    },
  });
}
