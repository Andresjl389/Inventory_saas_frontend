"use client";

import { ArrowLeftRight, X } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCombobox } from "@/features/products/components/product-combobox";
import { useProductDirectory } from "@/features/products/hooks/use-product-directory";
import type { Product } from "@/features/products/types/product.types";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { formatDateTime, formatSignedQuantity, toNumber } from "@/lib/format";
import { cn } from "cn";

import { useStockMovements } from "../hooks/use-stock";
import {
  DEFAULT_MOVEMENT_FILTERS,
  MOVEMENT_DIRECTION,
  MOVEMENT_TYPE_LABELS,
  REFERENCE_TYPE_LABELS,
  type MovementFilters,
  type StockMovement,
} from "../types/inventory.types";

const column = createDataTableColumns<StockMovement>();

/**
 * Cantidad con signo.
 *
 * Los movimientos guardan la cantidad en positivo y el sentido lo pone el
 * tipo, salvo en los ajustes, donde el propio numero ya viene firmado (igual
 * que `MovementType.direction` en el backend).
 */
function signedQuantity(movement: StockMovement): number {
  const raw = toNumber(movement.quantity);
  const direction = MOVEMENT_DIRECTION[movement.movement_type];
  return direction === 0 ? raw : Math.abs(raw) * direction;
}

export function MovementsView() {
  const [filters, setFilters] = useState<MovementFilters>(DEFAULT_MOVEMENT_FILTERS);
  const [filterProduct, setFilterProduct] = useState<Product | null>(null);

  const movements = useStockMovements(filters);
  const products = useProductDirectory();
  const warehouses = useWarehouses();

  const warehouseNames = useMemo(
    () => new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses.data],
  );

  const updateFilters = (patch: Partial<MovementFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetFilters = () => {
    setFilters(DEFAULT_MOVEMENT_FILTERS);
    setFilterProduct(null);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("created_at", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Fecha" />,
          meta: { width: "12rem" },
          cell: ({ getValue }) => (
            <span className="text-sm text-muted-foreground">{formatDateTime(getValue())}</span>
          ),
        }),
        column.accessor("product_id", {
          header: () => <span>Producto</span>,
          enableSorting: false,
          cell: ({ getValue }) => {
            const product = products.lookup(getValue());
            if (!product) {
              return (
                <span className="font-mono text-xs text-muted-foreground">
                  {getValue().slice(0, 8)}
                </span>
              );
            }
            return (
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{product.sku}</p>
              </div>
            );
          },
        }),
        column.accessor((row) => warehouseNames.get(row.warehouse_id) ?? "", {
          id: "warehouse",
          header: () => <span>Bodega</span>,
          enableSorting: false,
          cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">-</span>,
        }),
        column.accessor("movement_type", {
          header: () => <span>Tipo</span>,
          enableSorting: false,
          meta: { width: "11rem" },
          cell: ({ row }) => (
            <div className="flex flex-col items-start gap-0.5">
              <Badge variant="outline" className="font-normal">
                {MOVEMENT_TYPE_LABELS[row.original.movement_type]}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {REFERENCE_TYPE_LABELS[row.original.reference_type]}
              </span>
            </div>
          ),
        }),
        column.accessor((row) => signedQuantity(row), {
          id: "quantity",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Cantidad" align="right" />
          ),
          meta: { align: "right", width: "8rem" },
          cell: ({ getValue }) => {
            const value = getValue();
            return (
              <span
                className={cn(
                  "tnum block text-right font-medium",
                  value > 0 && "text-success",
                  value < 0 && "text-destructive",
                  value === 0 && "text-muted-foreground",
                )}
              >
                {formatSignedQuantity(value)}
              </span>
            );
          },
        }),
        column.accessor((row) => row.notes ?? "", {
          id: "notes",
          header: () => <span>Notas</span>,
          enableSorting: false,
          cell: ({ getValue }) => {
            const value = getValue();
            return value ? (
              <span className="line-clamp-1 text-muted-foreground">{value}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            );
          },
        }),
      ]),
    [products, warehouseNames],
  );

  const page = movements.data;
  const hasFilters = Boolean(filters.product_id) || Boolean(filters.warehouse_id);

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Movimientos"
          description="La pista de auditoria del inventario: cada entrada y salida, de la mas reciente a la mas antigua."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <div className="w-full sm:max-w-xs">
            <ProductCombobox
              value={filterProduct}
              placeholder="Todos los productos"
              onSelect={(product) => {
                setFilterProduct(product);
                updateFilters({ product_id: product.id });
              }}
            />
          </div>

          <WarehouseSelect
            className="w-full sm:w-52"
            includeAll
            ariaLabel="Filtrar por bodega"
            value={filters.warehouse_id ?? null}
            onChange={(warehouseId) => updateFilters({ warehouse_id: warehouseId })}
          />

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X aria-hidden />
              Limpiar
            </Button>
          ) : null}
        </DataTableToolbar>
      </Reveal>

      <Reveal delay={0.14}>
        <DataTable
          columns={columns}
          data={page?.items}
          isLoading={movements.isPending}
          isFetching={movements.isFetching && !movements.isPending}
          error={movements.error}
          onRetry={() => movements.refetch()}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={ArrowLeftRight}
              title={hasFilters ? "Sin movimientos que coincidan" : "Todavia no hay movimientos"}
              description={
                hasFilters
                  ? "Prueba con otros filtros."
                  : "Aqui apareceran las compras, ventas, ajustes y traslados."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
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
                label="movimientos"
                onPageChange={(next) => updateFilters({ page: next })}
                onSizeChange={(size) => updateFilters({ size })}
              />
            ) : null
          }
        />
      </Reveal>
    </>
  );
}
