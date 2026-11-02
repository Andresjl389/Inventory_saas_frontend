import { appConfig } from "@/config/env";

export const FILE_OWNER_TYPES = [
  "PRODUCT",
  "COMPANY",
  "SALE",
  "PURCHASE",
  "IMPORT",
  "EXPORT",
  "REPORT",
] as const;

export type FileOwnerType = (typeof FILE_OWNER_TYPES)[number];

/** `FileDTO` */
export type StoredFile = {
  id: string;
  company_id: string;
  owner_type: FileOwnerType;
  owner_id: string | null;
  filename: string;
  content_type: string;
  size_bytes: number;
  checksum: string;
  uploaded_by: string | null;
  created_at: string;
  download_url: string;
};

/**
 * URL para mostrar el archivo en la propia pagina.
 *
 * Va por el proxy a proposito: el token vive en una cookie httpOnly, asi que
 * el navegador no puede firmar la peticion por su cuenta, pero si la manda al
 * mismo origen las cookies viajan solas y el proxy pone la cabecera.
 */
export function fileContentUrl(fileId: string): string {
  return `${appConfig.bffPrefix}/files/${fileId}/content`;
}

/** Limites del backend: 10 MB y esta lista de tipos. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function isImage(file: StoredFile): boolean {
  return file.content_type.startsWith("image/");
}

/** Tamanos legibles: 1.4 MB se entiende, 1468006 no. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}
