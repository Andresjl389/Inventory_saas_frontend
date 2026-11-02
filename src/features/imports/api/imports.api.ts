import { appConfig } from "@/config/env";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type {
  EntitySchema,
  ImportAnalysis,
  ImportEntity,
  ImportJob,
  ImportResult,
  ImportRowError,
  MappingCommand,
} from "../types/import.types";

export const importsApi = {
  schemas: () => apiClient.get<EntitySchema[]>("/imports/schemas"),

  /**
   * Analiza el archivo y propone un mapeo. **No escribe nada**: es la primera
   * de las dos fases, y por eso se puede subir sin miedo.
   */
  analyze: (file: File, entity: ImportEntity) => {
    const form = new FormData();
    form.append("file", file);
    form.append("entity", entity);
    return apiClient.upload<ImportAnalysis>("/imports", form);
  },

  /** Manda el mapeo completo, no un parche; devuelve la vista previa rehecha. */
  setMapping: (jobId: string, command: MappingCommand) =>
    apiClient.patch<ImportAnalysis>(`/imports/${jobId}/mapping`, command),

  /** Ejecuta de verdad y revierte: sus numeros no son una estimacion. */
  validate: (jobId: string) => apiClient.post<ImportResult>(`/imports/${jobId}/validate`),

  run: (jobId: string) => apiClient.post<ImportResult>(`/imports/${jobId}/run`),

  cancel: (jobId: string) => apiClient.post<ImportJob>(`/imports/${jobId}/cancel`),

  get: (jobId: string) => apiClient.get<ImportJob>(`/imports/${jobId}`),

  list: (page: number, size = 10) =>
    apiClient.get<Paginated<ImportJob>>("/imports", { params: { page, size } }),

  errors: (jobId: string, page: number, size = 50) =>
    apiClient.get<Paginated<ImportRowError>>(`/imports/${jobId}/errors`, {
      params: { page, size },
    }),

  /**
   * URL de descarga de la plantilla.
   *
   * Pasa por el proxy para que viajen las cookies: el endpoint exige
   * `Authorization` y `X-Company-ID`, que el navegador no pondria solo. Asi un
   * enlace normal basta y el `Content-Disposition` del backend hace el resto.
   */
  templateUrl: (entity: ImportEntity) =>
    `${appConfig.bffPrefix}/imports/templates/${entity}`,
};
