"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/providers/session-provider";
import { cn } from "cn";

import { useDeleteFile, useFiles, useUploadFile } from "../hooks/use-files";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  fileContentUrl,
  formatBytes,
  isImage,
  type StoredFile,
} from "../types/file.types";

/**
 * Imagenes de un producto.
 *
 * Las miniaturas se cargan por el proxy (`/api/bff/files/.../content`): el
 * token vive en una cookie httpOnly, asi que un `<img>` al mismo origen es la
 * unica forma de que el navegador pueda mostrarlas sin exponerlo.
 */
export function ProductImages({ productId }: { productId: string }) {
  const canWrite = usePermission("files.write");
  const files = useFiles("PRODUCT", productId);
  const upload = useUploadFile();
  const remove = useDeleteFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<StoredFile | null>(null);

  const images = (files.data?.items ?? []).filter(isImage);

  const handleFiles = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;

    // Se comprueba aqui para dar respuesta inmediata; el backend rechaza igual.
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`${file.name} pesa ${formatBytes(file.size)}; el limite son 10 MB`);
      return;
    }

    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Solo se admiten imagenes JPG, PNG, WEBP o GIF");
      return;
    }

    upload.mutate({ file, ownerType: "PRODUCT", ownerId: productId });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Imagenes</p>
        {canWrite ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <ImagePlus aria-hidden />
            )}
            Subir
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        aria-label="Subir imagen del producto"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {files.isPending ? (
        <div className="grid grid-cols-4 gap-2" aria-hidden>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="shimmer aspect-square rounded-xl bg-foreground/6" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/60 px-3 py-6 text-center text-sm text-muted-foreground dark:border-white/12">
          Sin imagenes todavia.
        </p>
      ) : (
        <ul className="grid grid-cols-4 gap-2">
          {images.map((image) => (
            <li key={image.id} className="group/img relative">
              {/*
                `<img>` y no `next/image`: la imagen va por el proxy con la
                cookie de sesion, y el optimizador la pide desde el servidor,
                donde no hay cookie del usuario y devolveria un 401.
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileContentUrl(image.id)}
                alt={image.filename}
                loading="lazy"
                className={cn(
                  "aspect-square w-full rounded-xl border border-white/50 object-cover",
                  "dark:border-white/10",
                )}
              />
              {canWrite ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  aria-label={`Eliminar ${image.filename}`}
                  onClick={() => setPendingDelete(image)}
                  className="absolute right-1 top-1 opacity-0 backdrop-blur-sm transition-opacity group-hover/img:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 aria-hidden />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        destructive
        loading={remove.isPending}
        title="Eliminar esta imagen?"
        description={`${pendingDelete?.filename} (${formatBytes(pendingDelete?.size_bytes ?? 0)}). No se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!pendingDelete) return;
          remove.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </div>
  );
}
