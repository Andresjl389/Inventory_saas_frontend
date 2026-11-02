"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { categoryKeys } from "@/features/categories/api/categories.keys";
import { inventoryKeys } from "@/features/inventory/api/inventory.keys";
import { productKeys } from "@/features/products/api/products.keys";
import { warehouseKeys } from "@/features/warehouses/api/warehouses.keys";
import { useCompanyId } from "@/stores/tenant.store";

import { importsApi } from "../api/imports.api";
import { importKeys } from "../api/imports.keys";
import type { ImportEntity, MappingCommand } from "../types/import.types";

export function useImportSchemas() {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: importKeys.schemas(companyId),
    queryFn: () => importsApi.schemas(),
    // Es un catalogo estatico del backend.
    staleTime: 30 * 60_000,
  });
}

export function useImportJobs(page: number) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: importKeys.jobs(companyId, page),
    queryFn: () => importsApi.list(page),
    placeholderData: keepPreviousData,
  });
}

export function useImportErrors(jobId: string | null, page: number) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: importKeys.errors(companyId, jobId ?? "", page),
    queryFn: () => importsApi.errors(jobId as string, page),
    enabled: Boolean(jobId),
    placeholderData: keepPreviousData,
  });
}

export function useAnalyzeImport() {
  return useMutation({
    meta: { silent: true },
    mutationFn: ({ file, entity }: { file: File; entity: ImportEntity }) =>
      importsApi.analyze(file, entity),
  });
}

export function useSetMapping() {
  return useMutation({
    meta: { silent: true },
    mutationFn: ({ jobId, command }: { jobId: string; command: MappingCommand }) =>
      importsApi.setMapping(jobId, command),
  });
}

export function useValidateImport() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (jobId: string) => importsApi.validate(jobId),
  });
}

/**
 * La carga de verdad.
 *
 * Al terminar se invalida todo lo que una importacion puede haber cambiado:
 * catalogo, bodegas e inventario. Es mas barato que razonar por entidad y no
 * deja pantallas mostrando lo de antes.
 */
export function useRunImport() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (jobId: string) => importsApi.run(jobId),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: importKeys.all(companyId) }),
        queryClient.invalidateQueries({ queryKey: productKeys.all(companyId) }),
        queryClient.invalidateQueries({ queryKey: categoryKeys.all(companyId) }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.all(companyId) }),
        queryClient.invalidateQueries({ queryKey: inventoryKeys.all(companyId) }),
      ]);
      const { created = 0, updated = 0 } = result.stats;
      toast.success(`Importacion terminada: ${created} creados, ${updated} actualizados`);
    },
  });
}

export function useCancelImport() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => importsApi.cancel(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: importKeys.all(companyId) }),
  });
}
