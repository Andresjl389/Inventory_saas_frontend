"use client";

import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { SectionPanel } from "@/components/shared/section-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

import {
  IGNORE_COLUMN,
  IMPORT_OPTION_LABELS,
  type EntitySchema,
  type ImportAnalysis,
  type MappingCommand,
} from "../types/import.types";
import { ImportPreviewTable } from "./import-preview-table";

/**
 * Pantalla de mapeo: a la izquierda las columnas del archivo del usuario, a la
 * derecha los campos del sistema.
 *
 * El backend propone, pero no decide: una sugerencia con `needs_review` se
 * marca en pantalla porque es plausible y puede estar mal ("Centro de costo"
 * se parece a un costo y no lo es).
 */
export function ImportMappingStep({
  analysis,
  schema,
  onApply,
  applying,
  onValidate,
  validating,
}: {
  analysis: ImportAnalysis;
  schema: EntitySchema | null;
  onApply: (command: MappingCommand) => void;
  applying: boolean;
  /** Recibe el mapeo: quien orquesta lo guarda y despues simula, en ese orden. */
  onValidate: (command: MappingCommand) => void;
  validating: boolean;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const column of analysis.columns) {
      if (column.suggested_target) initial[column.source] = column.suggested_target;
    }
    return initial;
  });
  const [options, setOptions] = useState<Record<string, boolean>>({});
  const [decimalSeparator, setDecimalSeparator] = useState<string>("auto");
  const [dateFormat, setDateFormat] = useState<string>("auto");

  /** Un campo solo puede recibir una columna: si no, se pisan entre si. */
  const usedTargets = useMemo(() => new Set(Object.values(mapping)), [mapping]);

  const missingRequired = analysis.target_fields
    .filter((field) => field.required && !usedTargets.has(field.key))
    .map((field) => field.label);

  const buildCommand = (): MappingCommand => ({
    mapping,
    options,
    decimal_separator: decimalSeparator === "auto" ? null : decimalSeparator,
    date_format: dateFormat === "auto" ? null : dateFormat,
  });

  const setTarget = (source: string, target: string) => {
    setMapping((current) => {
      const next = { ...current };
      if (target === IGNORE_COLUMN) {
        delete next[source];
      } else {
        // Si ese campo ya lo tenia otra columna, se libera.
        for (const [key, value] of Object.entries(next)) {
          if (value === target && key !== source) delete next[key];
        }
        next[source] = target;
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {missingRequired.length > 0 ? (
        <GlassPanel
          sheen={false}
          className="flex items-start gap-3 border-warning/30 bg-warning/8 p-4"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="text-sm font-medium">Faltan campos obligatorios</p>
            <p className="text-sm text-muted-foreground">
              Sin {missingRequired.join(", ")} el archivo no se puede cargar.
            </p>
          </div>
        </GlassPanel>
      ) : null}

      <SectionPanel
        title={`Asignar columnas (${analysis.total_rows} filas en ${analysis.job.filename})`}
      >
        <ul className="divide-y divide-white/40 dark:divide-white/6">
          {analysis.columns.map((column) => {
            const target = mapping[column.source] ?? IGNORE_COLUMN;
            const ignored = target === IGNORE_COLUMN;

            return (
              <li
                key={column.source}
                className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_16rem]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{column.source}</p>
                    {column.needs_review && !ignored ? (
                      <Badge
                        variant="outline"
                        className="border-warning/50 font-normal text-warning"
                      >
                        Revisar
                      </Badge>
                    ) : null}
                  </div>
                  {column.samples.length > 0 ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {column.samples.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                </div>

                <ArrowRight
                  className="hidden size-4 shrink-0 text-muted-foreground sm:block"
                  aria-hidden
                />

                <Select value={target} onValueChange={(value) => setTarget(column.source, value)}>
                  <SelectTrigger
                    className={cn("w-full", ignored && "text-muted-foreground")}
                    aria-label={`Campo para la columna ${column.source}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={IGNORE_COLUMN}>No importar</SelectItem>
                    {analysis.target_fields.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            );
          })}
        </ul>
      </SectionPanel>

      <SectionPanel title="Como leer los datos">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="decimal-sep">Separador decimal</Label>
            <Select value={decimalSeparator} onValueChange={setDecimalSeparator}>
              <SelectTrigger id="decimal-sep" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detectar automaticamente</SelectItem>
                <SelectItem value=",">Coma (1.234,50)</SelectItem>
                <SelectItem value=".">Punto (1,234.50)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Fijalo si en la vista previa los importes se leen mal.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date-format">Formato de fecha</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger id="date-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detectar automaticamente</SelectItem>
                <SelectItem value="%d/%m/%Y">31/12/2026</SelectItem>
                <SelectItem value="%m/%d/%Y">12/31/2026</SelectItem>
                <SelectItem value="%Y-%m-%d">2026-12-31</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(schema?.options ?? []).map((option) => {
            const copy = IMPORT_OPTION_LABELS[option] ?? { label: option, help: "" };
            return (
              <div
                key={option}
                className="flex items-start gap-2 rounded-xl border border-white/50 bg-white/40 p-3 sm:col-span-2 dark:border-white/10 dark:bg-white/5"
              >
                <Checkbox
                  id={`opt-${option}`}
                  checked={options[option] ?? false}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({ ...current, [option]: checked === true }))
                  }
                  className="mt-0.5"
                />
                <Label htmlFor={`opt-${option}`} className="text-sm font-normal leading-snug">
                  {copy.label}
                  {copy.help ? (
                    <span className="block text-xs text-muted-foreground">{copy.help}</span>
                  ) : null}
                </Label>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/40 p-4 dark:border-white/6">
          <Button
            variant="outline"
            className="w-full"
            disabled={applying}
            onClick={() => onApply(buildCommand())}
          >
            {applying ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Actualizar vista previa
          </Button>
        </div>
      </SectionPanel>

      <ImportPreviewTable
        preview={analysis.preview}
        fields={analysis.target_fields}
        mapping={mapping}
      />

      <Button
        size="lg"
        className="w-full"
        disabled={missingRequired.length > 0 || validating || applying}
        // El backend simula lo que tiene guardado, asi que primero se guarda el
        // mapeo y solo entonces se simula. Encadenarlo es cosa del orquestador.
        onClick={() => onValidate(buildCommand())}
      >
        {validating ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Simular la importacion
      </Button>
    </div>
  );
}
