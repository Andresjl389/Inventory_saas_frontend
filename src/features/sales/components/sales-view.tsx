"use client";

import { Plus, ShoppingCart, X } from "lucide-react";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { PAYMENT_METHOD_LABELS } from "@/features/credit/types/credit.types";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { formatDateTime, formatMoney, formatNumber, toNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { useSales } from "../hooks/use-sales";
import {
  DEFAULT_SALE_FILTERS,
  SALE_STATUSES,
  SALE_STATUS_LABELS,
  type Sale,
  type SaleFilters,
  type SaleStatus,
} from "../types/sale.types";
import { SaleStatusBadge } from "./sale-status-badge";

const column = createDataTableColumns<Sale>();
const ALL = "all";

export function SalesView() {
  const canCreate = usePermission("sales.create");
  const router = useRouter();

  const [filters, setFilters] = useState<SaleFilters>(DEFAULT_SALE_FILTERS);
  const sales = useSales(filters);
  const warehouses = useWarehouses();

  const warehouseNames = useMemo(
    () => new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses.data],
  );

  const updateFilters = (patch: Partial<SaleFilters>) =>
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
        column.accessor((row) => toNumber(row.outstanding), {
          id: "payment",
          header: () => <span>Pago</span>,
          enableSorting: false,
          meta: { width: "10rem" },
          cell: ({ row, getValue }) => {
            const outstanding = getValue();
            return outstanding > 0 ? (
              <div className="min-w-0">
                <StatusBadge label="Fiado" tone="warning" />
                <p className="tnum mt-0.5 text-xs text-muted-foreground">
                  Debe {formatMoney(outstanding)}
                </p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {PAYMENT_METHOD_LABELS[row.original.payment_method]}
              </span>
            );
          },
        }),
        column.accessor("status", {
          header: () => <span>Estado</span>,
          enableSorting: false,
          meta: { width: "8rem" },
          cell: ({ getValue }) => <SaleStatusBadge status={getValue()} />,
        }),
      ]),
    [warehouseNames],
  );

  const page = sales.data;
  const hasFilters =
    Boolean(filters.status) || Boolean(filters.warehouse_id) || Boolean(filters.customer_id);

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Ventas"
          description="Cada venta completada descuenta stock de su bodega en una sola transaccion."
          actions={
            canCreate ? (
              <Button asChild>
                <Link href="/sales/new">
                  <Plus aria-hidden />
                  Nueva venta
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
              updateFilters({ status: value === ALL ? null : (value as SaleStatus) })
            }
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {SALE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {SALE_STATUS_LABELS[status]}
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
            <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_SALE_FILTERS)}>
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
          isLoading={sales.isPending}
          isFetching={sales.isFetching && !sales.isPending}
          error={sales.error}
          onRetry={() => sales.refetch()}
          getRowId={(row) => row.id}
          onRowClick={(sale) => router.push(`/sales/${sale.id}`)}
          emptyState={
            <EmptyState
              icon={ShoppingCart}
              title={hasFilters ? "Ninguna venta coincide" : "Todavia no hay ventas"}
              description={
                hasFilters
                  ? "Prueba con otros filtros."
                  : "Registra la primera venta para empezar a mover el inventario."
              }
              action={
                hasFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(DEFAULT_SALE_FILTERS)}
                  >
                    Limpiar filtros
                  </Button>
                ) : canCreate ? (
                  <Button size="sm" asChild>
                    <Link href="/sales/new">
                      <Plus aria-hidden />
                      Nueva venta
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
                label="ventas"
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
