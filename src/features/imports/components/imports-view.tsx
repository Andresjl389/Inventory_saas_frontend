"use client";

import { FileUp, RotateCcw } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import {
  useAnalyzeImport,
  useImportJobs,
  useImportSchemas,
  useRunImport,
  useSetMapping,
  useValidateImport,
} from "../hooks/use-imports";
import {
  IMPORT_STATUS_LABELS,
  type ImportAnalysis,
  type ImportEntity,
  type ImportResult,
  type ImportStatus,
  type MappingCommand,
} from "../types/import.types";
import { ImportEntityStep } from "./import-entity-step";
import { ImportMappingStep } from "./import-mapping-step";
import { ImportReviewStep } from "./import-review-step";

const STATUS_TONES: Record<ImportStatus, StatusTone> = {
  ANALYZED: "neutral",
  VALIDATED: "info",
  COMPLETED: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
};

/**
 * Asistente de importacion.
 *
 * Son dos fases a proposito: primero se analiza y se enseña como quedaria, y
 * solo despues se escribe. Nada se adivina en silencio.
 */
export function ImportsView() {
  const canRun = usePermission("imports.run");

  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const schemas = useImportSchemas();
  const jobs = useImportJobs(1);
  const analyze = useAnalyzeImport();
  const setMapping = useSetMapping();
  const validate = useValidateImport();
  const run = useRunImport();

  const schema =
    schemas.data?.find((item) => item.entity === analysis?.job.entity) ?? null;

  const reset = () => {
    setAnalysis(null);
    setResult(null);
    analyze.reset();
  };

  const handleAnalyze = (file: File, entity: ImportEntity) => {
    analyze.mutate({ file, entity }, { onSuccess: (fresh) => setAnalysis(fresh) });
  };

  const applyMapping = (command: MappingCommand) => {
    if (!analysis) return;
    setMapping.mutate(
      { jobId: analysis.job.id, command },
      { onSuccess: (fresh) => setAnalysis(fresh) },
    );
  };

  /**
   * Guardar y simular, en ese orden: el backend simula lo que tiene guardado,
   * asi que lanzar las dos cosas a la vez validaria el mapeo anterior.
   */
  const validateMapping = async (command: MappingCommand) => {
    if (!analysis) return;
    const fresh = await setMapping.mutateAsync({ jobId: analysis.job.id, command });
    setAnalysis(fresh);
    const simulation = await validate.mutateAsync(analysis.job.id);
    setResult(simulation);
  };

  const step = result ? "review" : analysis ? "map" : "pick";

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Importar"
          description="Sube un Excel o CSV, revisa como se leyo y solo entonces carga. Nada se escribe hasta el ultimo paso."
          actions={
            step !== "pick" ? (
              <Button variant="outline" onClick={reset}>
                <RotateCcw aria-hidden />
                Empezar de nuevo
              </Button>
            ) : null
          }
        />
      </Reveal>

      {!canRun ? (
        <Reveal delay={0.08}>
          <SectionPanel title="Importar">
            <EmptyState
              icon={FileUp}
              title="Sin permiso para importar"
              description="Tu rol puede ver el historial pero no ejecutar cargas."
            />
          </SectionPanel>
        </Reveal>
      ) : (
        <Reveal delay={0.08} key={step}>
          {step === "pick" ? (
            <ImportEntityStep
              onAnalyze={handleAnalyze}
              analyzing={analyze.isPending}
              error={analyze.error}
            />
          ) : step === "map" && analysis ? (
            <ImportMappingStep
              analysis={analysis}
              schema={schema}
              onApply={applyMapping}
              applying={setMapping.isPending}
              onValidate={validateMapping}
              validating={validate.isPending || setMapping.isPending}
            />
          ) : result ? (
            <ImportReviewStep
              result={result}
              running={run.isPending}
              onBack={() => setResult(null)}
              onRun={() => {
                if (!analysis) return;
                run.mutate(analysis.job.id, { onSuccess: (done) => setResult(done) });
              }}
            />
          ) : null}
        </Reveal>
      )}

      <Reveal delay={0.16}>
        <SectionPanel title="Importaciones anteriores">
          {jobs.isPending ? (
            <div className="space-y-3 p-4" aria-hidden>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="shimmer h-10 w-full rounded-xl bg-foreground/6" />
              ))}
            </div>
          ) : (jobs.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={FileUp}
              title="Todavia no has importado nada"
              description="Cuando cargues un archivo, aqui queda el registro."
            />
          ) : (
            <ul className="divide-y divide-white/40 dark:divide-white/6">
              {jobs.data?.items.map((job) => (
                <li key={job.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.filename}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.entity} · {formatDateTime(job.created_at)}
                    </p>
                  </div>
                  {job.stats.created !== undefined || job.stats.updated !== undefined ? (
                    <span className="tnum hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {formatNumber(job.stats.created ?? 0)} creados ·{" "}
                      {formatNumber(job.stats.updated ?? 0)} actualizados
                    </span>
                  ) : null}
                  <StatusBadge
                    label={IMPORT_STATUS_LABELS[job.status]}
                    tone={STATUS_TONES[job.status]}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>
      </Reveal>
    </>
  );
}
