import type { FileOwnerType } from "../types/file.types";

export const fileKeys = {
  all: (companyId: string) => ["files", companyId] as const,
  list: (companyId: string, ownerType: FileOwnerType, ownerId: string | null) =>
    [...fileKeys.all(companyId), ownerType, ownerId ?? "sin-dueno"] as const,
};
