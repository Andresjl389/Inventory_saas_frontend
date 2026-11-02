"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCompanyId } from "@/stores/tenant.store";

import { filesApi } from "../api/files.api";
import { fileKeys } from "../api/files.keys";
import type { FileOwnerType } from "../types/file.types";

export function useFiles(
  ownerType: FileOwnerType,
  ownerId: string | null,
  options: { enabled?: boolean } = {},
) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: fileKeys.list(companyId, ownerType, ownerId),
    queryFn: () => filesApi.list(ownerType, ownerId),
    enabled: (options.enabled ?? true) && Boolean(ownerId),
  });
}

function useInvalidateFiles() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: fileKeys.all(companyId) });
}

export function useUploadFile() {
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: ({
      file,
      ownerType,
      ownerId,
    }: {
      file: File;
      ownerType: FileOwnerType;
      ownerId: string | null;
    }) => filesApi.upload(file, ownerType, ownerId),
    onSuccess: async (stored) => {
      await invalidate();
      toast.success(`${stored.filename} subido`);
    },
  });
}

export function useDeleteFile() {
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: (fileId: string) => filesApi.remove(fileId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Archivo eliminado");
    },
  });
}
