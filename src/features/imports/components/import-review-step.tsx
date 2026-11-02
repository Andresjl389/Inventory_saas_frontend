"use client";

import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Play } from "lucide-react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "cn";

import type { ImportResult } from "../types/import.types";

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "good" | "bad";
}) {
  return (
    <GlassPanel variant="thin" sheen={false} className="rounded-xl p-3 text-center">
      <p
        className={cn(
          "text-2xl font-semibold tracking-tight",
          tone === "good" && value > 0 && "text-success",
          tone === "bad" && value > 0 && "text-destructive",
        )}
      >
        {formatNumber(value)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </GlassPanel>
  );
}

/**
 * Resultado de la simulacion.
 *
 * `validate` ejecuta la carga de verdad dentro de un savepoint y la revierte,
 * asi que estos numeros **no son una estimacion**: es exactamente lo que va a
 * pasar. Por eso se piden confirmar antes de `run`.
 */
export function ImportReviewStep({
  result,
  onRun,
  running,
  onBack,
}: {
  result: ImportResult;
  onRun: () => void;
  running: boolean;
  onBack: () => void;
}) {
  const stats = result.stats;
  const errors = stats.errors ?? 0;
  const done = !result.dry_run;

  return (
    <div className="space-y-4">
      <GlassPanel
        sheen={false}
        className={cn(
          "flex items-start gap-3 p-4",
          done ? "border-success/30 bg-success/8" : errors > 0 ? "border-warning/30 bg-warning/8" : "",
        )}
      >
        {done ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        ) : errors > 0 ? (
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        ) : (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div>
          <p className="text-sm font-medium">
            {done
              ? "Importacion completada"
              : errors > 0
                ? "La simulacion encontro problemas"
                : "Todo listo para importar"}
          </p>
          <p className="text-sm text-muted-foreground">
            {done
              ? "Los datos ya estan cargados."
              : "Esto es lo que pasaria exactamente: la simulacion ejecuta la carga y la deshace."}
          </p>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Filas" value={stats.total_rows ?? 0} />
        <Stat label="Creados" value={stats.created ?? 0} tone="good" />
        <Stat label="Actualizados" value={stats.updated ?? 0} tone="good" />
        <Stat label="Omitidos" value={stats.skipped ?? 0} />
        <Stat label="Errores" value={errors} tone="bad" />
      </div>

      {result.errors_preview.length > 0 ? (
        <SectionPanel title={`Errores (${formatNumber(errors)})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/40 dark:border-white/6">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Fila
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Columna
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Problema
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 dark:divide-white/6">
                {result.errors_preview.map((error, index) => (
                  <tr key={`${error.row_number}-${error.column ?? index}`}>
                    {/* Fila y columna son las del archivo del usuario, no las nuestras. */}
                    <td className="tnum px-4 py-2 align-top">{error.row_number}</td>
                    <td className="px-4 py-2 align-top text-muted-foreground">
                      {error.column ?? "-"}
                    </td>
                    <td className="px-4 py-2 align-top font-mono text-xs">
                      {error.value ?? "-"}
                    </td>
                    <td className="px-4 py-2 align-top text-destructive">{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/40 px-4 py-2.5 text-xs text-muted-foreground dark:border-white/6">
            Corrige esas filas en tu archivo y vuelve a subirlo: todas las entidades hacen
            upsert, asi que reimportar no duplica nada.
          </p>
        </SectionPanel>
      ) : null}

      {!done ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="sm:flex-1" onClick={onBack} disabled={running}>
            <ArrowLeft aria-hidden />
            Volver al mapeo
          </Button>
          <Button className="sm:flex-1" size="lg" onClick={onRun} disabled={running}>
            {running ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
            Importar de verdad
          </Button>
        </div>
      ) : null}
    </div>
  );
}
