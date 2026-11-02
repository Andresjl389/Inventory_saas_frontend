"use client";

import { SectionPanel } from "@/components/shared/section-panel";
import { cn } from "cn";

import type { FieldSpec, PreviewRow } from "../types/import.types";

/**
 * Vista previa del archivo.
 *
 * Lo importante es ver `raw` y `value` **uno al lado del otro**: es donde el
 * usuario descubre que su "1.500" se leyo como 1500 y no como 1,5. Si solo se
 * mostrara el valor interpretado, ese error pasaria desapercibido hasta
 * despues de cargar.
 */
export function ImportPreviewTable({
  preview,
  fields,
  mapping,
}: {
  preview: PreviewRow[];
  fields: FieldSpec[];
  mapping: Record<string, string>;
}) {
  const mapped = new Set(Object.values(mapping));
  const visible = fields.filter((field) => mapped.has(field.key));

  if (preview.length === 0 || visible.length === 0) {
    return (
      <SectionPanel title="Vista previa">
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Asigna al menos una columna para ver como se leeria el archivo.
        </p>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={`Vista previa (${preview.length} filas)`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/40 dark:border-white/6">
              <th className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground">
                Fila
              </th>
              {visible.map((field) => (
                <th
                  key={field.key}
                  className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground"
                >
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40 dark:divide-white/6">
            {preview.map((row) => (
              <tr key={row.row_number}>
                <td className="tnum px-4 py-2 align-top text-xs text-muted-foreground">
                  {row.row_number}
                </td>
                {visible.map((field) => {
                  const cell = row.cells.find((item) => item.field_key === field.key);
                  if (!cell) {
                    return (
                      <td key={field.key} className="px-4 py-2 align-top text-muted-foreground">
                        -
                      </td>
                    );
                  }
                  const changed = cell.raw !== cell.value;
                  return (
                    <td key={field.key} className="px-4 py-2 align-top">
                      <span
                        className={cn(
                          "block",
                          cell.error ? "font-medium text-destructive" : undefined,
                        )}
                      >
                        {cell.value ?? "-"}
                      </span>
                      {/* Solo se muestra el original cuando difiere: si no, es ruido. */}
                      {changed ? (
                        <span className="block text-xs text-muted-foreground line-through">
                          {cell.raw ?? ""}
                        </span>
                      ) : null}
                      {cell.error ? (
                        <span className="block text-xs text-destructive">{cell.error}</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPanel>
  );
}
