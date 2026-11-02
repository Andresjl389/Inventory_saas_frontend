"use client";

import { ScrollText } from "lucide-react";
import { useMemo } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Paginated } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

import { AUDIT_ACTION_LABELS, type AuditEntry } from "../types/audit.types";

const column = createDataTableColumns<AuditEntry>();

/**
 * Tabla de auditoria. La comparten la empresa y la plataforma: el DTO es el
 * mismo, solo cambia el endpoint y si se muestra la columna de empresa.
 */
export function AuditTable({
  page,
  isLoading,
  isFetching,
  error,
  onRetry,
  onPageChange,
  onSizeChange,
  showCompany = false,
  hasFilters = false,
  onClearFilters,
}: {
  page: Paginated<AuditEntry> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  showCompany?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}) {
  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("created_at", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Cuando" />,
          meta: { width: "12rem" },
          cell: ({ getValue }) => (
            <span className="text-sm text-muted-foreground">{formatDateTime(getValue())}</span>
          ),
        }),
        column.accessor("action", {
          header: () => <span>Accion</span>,
          enableSorting: false,
          meta: { width: "14rem" },
          cell: ({ getValue }) => (
            <Badge variant="outline" className="font-normal">
              {AUDIT_ACTION_LABELS[getValue()] ?? getValue()}
            </Badge>
          ),
        }),
        column.accessor((row) => row.entity_type ?? "", {
          id: "entity",
          header: () => <span>Sobre</span>,
          enableSorting: false,
          cell: ({ row }) => {
            const { entity_type: type, entity_id: id } = row.original;
            if (!type && !id) return <span className="text-muted-foreground">-</span>;
            return (
              <div className="min-w-0">
                {type ? <p className="truncate text-sm">{type}</p> : null}
                {id ? (
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {id.slice(0, 8)}
                  </p>
                ) : null}
              </div>
            );
          },
        }),
        ...(showCompany
          ? [
              column.accessor((row) => row.company_id ?? "", {
                id: "company",
                header: () => <span>Empresa</span>,
                enableSorting: false,
                meta: { width: "9rem" },
                cell: ({ getValue }) => {
                  const value = getValue();
                  return value ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {value.slice(0, 8)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Plataforma</span>
                  );
                },
              }),
            ]
          : []),
        column.accessor((row) => row.ip_address ?? "", {
          id: "ip",
          header: () => <span>Origen</span>,
          enableSorting: false,
          meta: { width: "10rem" },
          cell: ({ getValue }) => (
            <span className="font-mono text-xs text-muted-foreground">{getValue() || "-"}</span>
          ),
        }),
      ]),
    [showCompany],
  );

  return (
    <DataTable
      columns={columns}
      data={page?.items}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={onRetry}
      getRowId={(row) => row.id}
      emptyState={
        <EmptyState
          icon={ScrollText}
          title={hasFilters ? "Ningun evento coincide" : "Todavia no hay eventos"}
          description={
            hasFilters
              ? "Prueba con otro filtro."
              : "Aqui queda registrado lo que va pasando."
          }
          action={
            hasFilters && onClearFilters ? (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Limpiar filtros
              </Button>
            ) : null
          }
        />
      }
      footer={
        page && page.total > 0 ? (
          <DataTablePagination
            page={page.page}
            size={page.size}
            total={page.total}
            pages={page.pages}
            label="eventos"
            onPageChange={onPageChange}
            onSizeChange={onSizeChange}
          />
        ) : null
      }
    />
  );
}
