"use client";

import { Download, Loader2, Play, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";

import { platformApi } from "../api/platform.api";
import { useCompanyOnboarding } from "../hooks/use-platform";
import {
  ONBOARDING_SHEET_LABELS,
  type OnboardingResult,
  type OnboardingSheetStatus,
} from "../types/platform.types";

const SHEET_TONES: Record<OnboardingSheetStatus, StatusTone> = {
  LOADED: "success",
  LOADED_WITH_ERRORS: "warning",
  SKIPPED: "neutral",
  EMPTY: "neutral",
  MISSING_COLUMNS: "danger",
};

/**
 * Carga inicial de una empresa desde un libro con una hoja por entidad.
 *
 * Las hojas se procesan en orden de dependencia dentro de **un solo
 * savepoint**: o la empresa queda montada o no se toco nada. Por eso primero
 * se simula y se ensena el resumen, y solo despues se carga de verdad.
 */
export function CompanyOnboardingDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
}: {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const onboarding = useCompanyOnboarding();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    onboarding.reset();
  };

  const submit = (dryRun: boolean) => {
    if (!file) return;
    onboarding.mutate(
      { companyId, file, dryRun },
      { onSuccess: (fresh) => setResult(fresh) },
    );
  };

  const handleFile = (list: FileList | null) => {
    const picked = list?.[0];
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("La carga inicial usa el libro .xlsx de la plantilla");
      return;
    }
    setFile(picked);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Carga inicial</DialogTitle>
          <DialogDescription>
            Monta {companyName} de una vez: categorias, bodegas, productos, clientes,
            proveedores y stock, en ese orden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <GlassPanel variant="thin" sheen={false} className="flex items-center gap-3 rounded-xl p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Plantilla del libro</p>
              <p className="text-xs text-muted-foreground">
                Una hoja por entidad, con las columnas que el sistema reconoce.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={platformApi.onboardingTemplateUrl()} download>
                <Download aria-hidden />
                Descargar
              </a>
            </Button>
          </GlassPanel>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label="Libro de carga inicial"
            onChange={(event) => handleFile(event.target.files)}
          />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={onboarding.isPending}
          >
            <Upload aria-hidden />
            {file ? file.name : "Elegir libro"}
          </Button>

          {onboarding.error ? <ErrorState error={onboarding.error} className="py-6" /> : null}

          {result ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ["Filas", result.totals.total_rows],
                    ["Creados", result.totals.created],
                    ["Actualizados", result.totals.updated],
                    ["Errores", result.totals.errors],
                  ] as const
                ).map(([label, value]) => (
                  <GlassPanel
                    key={label}
                    variant="thin"
                    sheen={false}
                    className="rounded-xl p-2.5 text-center"
                  >
                    <p className="text-lg font-semibold tracking-tight">{formatNumber(value)}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </GlassPanel>
                ))}
              </div>

              <ul className="divide-y divide-white/40 rounded-xl border border-white/50 dark:divide-white/6 dark:border-white/10">
                {result.sheets.map((sheet) => (
                  <li key={sheet.entity} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{sheet.sheet}</p>
                      {sheet.missing_required.length > 0 ? (
                        <p className="truncate text-xs text-destructive">
                          Faltan: {sheet.missing_required.join(", ")}
                        </p>
                      ) : sheet.stats.total_rows > 0 ? (
                        <p className="tnum truncate text-xs text-muted-foreground">
                          {formatNumber(sheet.stats.created)} creados ·{" "}
                          {formatNumber(sheet.stats.updated)} actualizados
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge
                      label={ONBOARDING_SHEET_LABELS[sheet.status] ?? sheet.status}
                      tone={SHEET_TONES[sheet.status] ?? "neutral"}
                    />
                  </li>
                ))}
              </ul>

              {result.dry_run ? (
                <p className="text-center text-xs text-muted-foreground">
                  Esto es una simulacion: todavia no se escribio nada.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={onboarding.isPending}
          >
            Cerrar
          </Button>

          {result && !result.dry_run ? null : (
            <>
              <Button
                variant="outline"
                disabled={!file || onboarding.isPending}
                onClick={() => submit(true)}
              >
                {onboarding.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Simular
              </Button>
              <Button
                disabled={!file || !result || onboarding.isPending}
                onClick={() => submit(false)}
              >
                {onboarding.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Play aria-hidden />
                )}
                Cargar de verdad
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
