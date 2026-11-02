import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { FileOwnerType, StoredFile } from "../types/file.types";

export const filesApi = {
  list: (ownerType: FileOwnerType, ownerId: string | null, size = 20) =>
    apiClient.get<Paginated<StoredFile>>("/files", {
      params: { page: 1, size, owner_type: ownerType, owner_id: ownerId ?? undefined },
    }),

  upload: (file: File, ownerType: FileOwnerType, ownerId: string | null) => {
    const form = new FormData();
    form.append("file", file);
    form.append("owner_type", ownerType);
    if (ownerId) form.append("owner_id", ownerId);
    return apiClient.upload<StoredFile>("/files", form);
  },

  remove: (fileId: string) => apiClient.delete<void>(`/files/${fileId}`),
};
