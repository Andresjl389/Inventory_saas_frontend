"use client";

import { Plus, Truck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { formatDateTime, formatMoney, formatNumber, toNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { usePurchases } from "../hooks/use-purchases";
import {
  DEFAULT_PURCHASE_FILTERS,
  PURCHASE_STATUSES,
  PURCHASE_STATUS_LABELS,
  type Purchase,
  type PurchaseFilters,
  type PurchaseStatus,
} from "../types/purchase.types";
import { PurchaseStatusBadge } from "./purchase-status-badge";

const column = createDataTableColumns<Purchase>();
const ALL = "all";

export function PurchasesView() {
  const canCreate = usePermission("purchases.create");
  const router = useRouter();

  const [filters, setFilters] = useState<PurchaseFilters>(DEFAULT_PURCHASE_FILTERS);
  const purchases = usePurchases(filters);
  const warehouses = useWarehouses();

  const warehouseNames = useMemo(
    () => new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses.data],
  );

  const updateFilters = (patch: Partial<PurchaseFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("created_at", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Fecha" />,
          meta: { width: "12rem" },
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="text-sm">{formatDateTime(row.original.created_at)}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {row.original.id.slice(0, 8)}
              </p>
            </div>
          ),
        }),
        column.accessor((row) => warehouseNames.get(row.warehouse_id) ?? "", {
          id: "warehouse",
          header: () => <span>Bodega</span>,
          enableSorting: false,
          cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">-</span>,
        }),
        column.accessor((row) => row.items.length, {
          id: "items",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Lineas" align="right" />
          ),
          meta: { align: "right", width: "7rem" },
          cell: ({ getValue }) => (
            <span className="tnum block text-right text-muted-foreground">
              {formatNumber(getValue())}
            </span>
          ),
        }),
        column.accessor((row) => toNumber(row.total), {
          id: "total",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Total" align="right" />
          ),
          meta: { align: "right", width: "10rem" },
          cell: ({ getValue }) => (
            <span className="tnum block text-right font-medium">{formatMoney(getValue())}</span>
          ),
        }),
        column.accessor("status", {
          header: () => <span>Estado</span>,
          enableSorting: false,
          meta: { width: "8rem" },
          cell: ({ getValue }) => <PurchaseStatusBadge status={getValue()} />,
        }),
      ]),
    [warehouseNames],
  );

  const page = purchases.data;
  const hasFilters =
    Boolean(filters.status) || Boolean(filters.warehouse_id) || Boolean(filters.supplier_id);

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Compras"
          description="Cada compra completada suma stock a su bodega y puede refrescar el coste del producto."
          actions={
            canCreate ? (
              <Button asChild>
                <Link href="/purchases/new">
                  <Plus aria-hidden />
                  Nueva compra
                </Link>
              </Button>
            ) : null
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) =>
              updateFilters({ status: value === ALL ? null : (value as PurchaseStatus) })
            }
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {PURCHASE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {PURCHASE_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <WarehouseSelect
            className="w-full sm:w-52"
            includeAll
            ariaLabel="Filtrar por bodega"
            value={filters.warehouse_id ?? null}
            onChange={(warehouseId) => updateFilters({ warehouse_id: warehouseId })}
          />

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_PURCHASE_FILTERS)}>
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
          isLoading={purchases.isPending}
          isFetching={purchases.isFetching && !purchases.isPending}
          error={purchases.error}
          onRetry={() => purchases.refetch()}
          getRowId={(row) => row.id}
          onRowClick={(purchase) => router.push(`/purchases/${purchase.id}`)}
          emptyState={
            <EmptyState
              icon={Truck}
              title={hasFilters ? "Ninguna compra coincide" : "Todavia no hay compras"}
              description={
                hasFilters
                  ? "Prueba con otros filtros."
                  : "Registra una compra para dar entrada a mercancia."
              }
              action={
                hasFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(DEFAULT_PURCHASE_FILTERS)}
                  >
                    Limpiar filtros
                  </Button>
                ) : canCreate ? (
                  <Button size="sm" asChild>
                    <Link href="/purchases/new">
                      <Plus aria-hidden />
                      Nueva compra
                    </Link>
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
                label="compras"
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
