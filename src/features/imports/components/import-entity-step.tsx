"use client";

import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/features/files/types/file.types";
import { cn } from "cn";

import { importsApi } from "../api/imports.api";
import { useImportSchemas } from "../hooks/use-imports";
import { ENTITY_ORDER, type EntitySchema, type ImportEntity } from "../types/import.types";

/** Tope del backend: 20.000 filas, y los archivos grandes pesan. */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Tipos que acepta el backend para una importacion.
 *
 * El navegador deduce el MIME del sistema operativo y no siempre acierta: un
 * `.csv` puede llegar como `application/vnd.ms-excel`. Por eso se acepta
 * tambien por extension, y el backend queda como ultima palabra.
 */
const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];

function looksImportable(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export function ImportEntityStep({
  onAnalyze,
  analyzing,
  error,
}: {
  onAnalyze: (file: File, entity: ImportEntity) => void;
  analyzing: boolean;
  error: unknown;
}) {
  const schemas = useImportSchemas();
  const [entity, setEntity] = useState<ImportEntity | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ordered = ENTITY_ORDER.map((key) =>
    schemas.data?.find((schema) => schema.entity === key),
  ).filter((schema): schema is EntitySchema => Boolean(schema));

  const selected = ordered.find((schema) => schema.entity === entity) ?? null;

  const handleFile = (list: FileList | null) => {
    const file = list?.[0];
    if (!file || !entity) return;

    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} pesa ${formatBytes(file.size)}; el limite son 10 MB`);
      return;
    }

    if (!looksImportable(file)) {
      toast.error("Solo se admiten archivos CSV o XLSX");
      return;
    }

    onAnalyze(file, entity);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (schemas.error) {
    return <ErrorState error={schemas.error} onRetry={() => schemas.refetch()} />;
  }

  return (
    <div className="space-y-4">
      <SectionPanel title="1. Que vas a importar">
        {schemas.isPending ? (
          <div className="grid gap-2 p-4 sm:grid-cols-2" aria-hidden>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="shimmer h-16 rounded-xl bg-foreground/6" />
            ))}
          </div>
        ) : (
          <>
            <ul className="grid gap-2 p-4 sm:grid-cols-2">
              {ordered.map((schema) => {
                const active = schema.entity === entity;
                return (
                  <li key={schema.entity}>
                    <button
                      type="button"
                      onClick={() => setEntity(schema.entity)}
                      aria-pressed={active}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-all duration-300",
                        active
                          ? "border-primary/40 bg-primary/8"
                          : "border-white/50 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                      )}
                    >
                      <p className="text-sm font-medium">{schema.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {schema.description}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="border-t border-white/40 px-4 py-2.5 text-xs text-muted-foreground dark:border-white/6">
              Ese es el orden recomendado: un producto necesita su categoria, y el stock
              necesita producto y bodega.
            </p>
          </>
        )}
      </SectionPanel>

      {selected ? (
        <SectionPanel title="2. El archivo">
          <div className="space-y-4 p-4">
            <GlassPanel variant="thin" sheen={false} className="flex items-center gap-3 rounded-xl p-3">
              <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Empieza por la plantilla</p>
                <p className="text-xs text-muted-foreground">
                  Trae las columnas con el nombre que el sistema reconoce; es el camino corto.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                {/* Enlace normal: pasa por el proxy y el navegador manda las cookies. */}
                <a href={importsApi.templateUrl(selected.entity)} download>
                  <Download aria-hidden />
                  Plantilla
                </a>
              </Button>
            </GlassPanel>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              aria-label="Archivo a importar"
              onChange={(event) => handleFile(event.target.files)}
            />

            <Button
              className="w-full"
              size="lg"
              disabled={analyzing}
              onClick={() => inputRef.current?.click()}
            >
              {analyzing ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
              {analyzing ? "Analizando..." : `Subir archivo de ${selected.label.toLowerCase()}`}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Subirlo solo lo analiza: todavia no se escribe nada.
            </p>

            {error ? <ErrorState error={error} className="py-6" /> : null}
          </div>
        </SectionPanel>
      ) : null}
    </div>
  );
}
