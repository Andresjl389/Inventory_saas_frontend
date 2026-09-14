"use client";

import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { TableSkeleton } from "@/components/shared/loading-state";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { staggerContainer } from "@/components/shared/motion/transitions";
import { cn } from "cn";

/**
 * Tabla reutilizable.
 *
 * Paginacion, busqueda y filtros son responsabilidad del servidor: aqui solo
 * se registra el orden, que se aplica a las filas ya descargadas. Por eso el
 * pie avisa de que el orden alcanza solo a la pagina visible.
 */
type DataTableColumnMeta = {
  /** Ancho fijo de la columna, por ejemplo "8rem". */
  width?: string;
  align?: "left" | "right";
};

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  // Slot de tipos de v9: evita el declaration merging global de `ColumnMeta`.
  columnMeta: {} as DataTableColumnMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

export function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

/** Referencia estable: una nueva cada render invalidaria los modelos. */
const EMPTY: never[] = [];

export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading = false,
  isFetching = false,
  error = null,
  onRetry,
  emptyState,
  getRowId,
  onRowClick,
  footer,
  className,
}: {
  columns: DataTableColumn<TData>[];
  data: TData[] | undefined;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyState?: ReactNode;
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: TData) => void;
  footer?: ReactNode;
  className?: string;
}) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: data ?? (EMPTY as TData[]),
    getRowId,
  });

  const rows = table.getRowModel().rows;

  return (
    <GlassPanel sheen={false} className={cn("rounded-2xl", className)}>
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : rows.length === 0 ? (
        (emptyState ?? null)
      ) : (
        <div className="relative overflow-x-auto">
          {/* Refetch en segundo plano: la tabla se atenua en lugar de desaparecer. */}
          <div
            className={cn(
              "transition-opacity",
              isFetching && "pointer-events-none opacity-60",
            )}
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow
                    key={group.id}
                    className="border-white/40 hover:bg-transparent dark:border-white/6"
                  >
                    {group.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          // El estado de orden pertenece a la celda de cabecera:
                          // es lo que anuncian los lectores de pantalla.
                          aria-sort={
                            sorted === "asc"
                              ? "ascending"
                              : sorted === "desc"
                                ? "descending"
                                : header.column.getCanSort()
                                  ? "none"
                                  : undefined
                          }
                          style={
                            header.column.columnDef.meta?.width
                              ? { width: header.column.columnDef.meta.width }
                              : undefined
                          }
                          className={cn(
                            "h-11 px-4 text-xs font-medium tracking-wide text-muted-foreground",
                            header.column.columnDef.meta?.align === "right" && "text-right",
                          )}
                        >
                          {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              {/* Las filas entran escalonadas: la tabla se compone, no aparece. */}
              <motion.tbody
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="[&_tr:last-child]:border-0"
              >
                {rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      "border-b border-white/40 transition-colors duration-300 hover:bg-foreground/4 dark:border-white/6",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3.5">
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </motion.tbody>
            </Table>
          </div>
        </div>
      )}

      {footer}
    </GlassPanel>
  );
}
