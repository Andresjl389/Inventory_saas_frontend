"use client";

import { Pencil, Plus, Power, PowerOff, Warehouse as WarehouseIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { useToggleWarehouseActive } from "../hooks/use-warehouse-mutations";
import { useWarehouses } from "../hooks/use-warehouses";
import type { Warehouse } from "../types/warehouse.types";
import { WarehouseFormDialog } from "./warehouse-form-dialog";

const column = createDataTableColumns<Warehouse>();

export function WarehousesView() {
  const canWrite = usePermission("warehouses.write");
  const warehouses = useWarehouses();
  const toggleActive = useToggleWarehouseActive();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Warehouse | null>(null);

  /**
   * `GET /warehouses` devuelve la lista completa, asi que el filtro puede ser
   * local. Si algun dia se pagina, este filtro tiene que irse al servidor.
   */
  const rows = useMemo(() => {
    const all = warehouses.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(term) ||
        (warehouse.address ?? "").toLowerCase().includes(term),
    );
  }, [warehouses.data, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("name", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Bodega" />,
          cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        }),
        column.accessor((row) => row.address ?? "", {
          id: "address",
          header: () => <span>Direccion</span>,
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
        column.accessor("is_active", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Estado" />,
          meta: { width: "7rem" },
          cell: ({ getValue }) => <ActiveBadge active={getValue()} activeLabel="Activa" inactiveLabel="Inactiva" />,
        }),
        column.accessor("created_at", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Creada" />,
          meta: { width: "10rem" },
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{formatDate(getValue())}</span>
          ),
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) => (
            <RowActions
              label={row.original.name}
              actions={[
                {
                  label: "Editar",
                  icon: Pencil,
                  hidden: !canWrite,
                  onSelect: () => {
                    setEditing(row.original);
                    setFormOpen(true);
                  },
                },
                {
                  label: row.original.is_active ? "Desactivar" : "Reactivar",
                  icon: row.original.is_active ? PowerOff : Power,
                  destructive: row.original.is_active,
                  hidden: !canWrite,
                  onSelect: () => {
                    if (row.original.is_active) {
                      setPendingToggle(row.original);
                    } else {
                      toggleActive.mutate({ warehouseId: row.original.id, isActive: false });
                    }
                  },
                },
              ]}
            />
          ),
        }),
      ]),
    [canWrite, toggleActive],
  );

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Bodegas"
          description="Cada bodega guarda su propio stock. Los movimientos siempre apuntan a una."
          actions={
            canWrite ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden />
                Nueva bodega
              </Button>
            ) : null
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <SearchInput
            defaultValue={search}
            onChange={setSearch}
            placeholder="Buscar bodega..."
            label="Buscar bodegas"
            className="w-full sm:max-w-xs"
          />
        </DataTableToolbar>
      </Reveal>

      <Reveal delay={0.14}>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={warehouses.isPending}
          isFetching={warehouses.isFetching && !warehouses.isPending}
          error={warehouses.error}
          onRetry={() => warehouses.refetch()}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={WarehouseIcon}
              title={search ? "Ninguna bodega coincide" : "Todavia no hay bodegas"}
              description={
                search
                  ? "Prueba con otro termino de busqueda."
                  : "Crea la primera bodega para poder registrar stock."
              }
              action={
                !search && canWrite ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus aria-hidden />
                    Nueva bodega
                  </Button>
                ) : null
              }
            />
          }
        />
      </Reveal>

      <WarehouseFormDialog open={formOpen} onOpenChange={setFormOpen} warehouse={editing} />

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
        destructive
        loading={toggleActive.isPending}
        title={`Desactivar ${pendingToggle?.name}?`}
        description="No podras registrar nuevos movimientos en esta bodega, pero su historico y su stock se conservan. Puedes reactivarla cuando quieras."
        confirmLabel="Desactivar"
        onConfirm={() => {
          if (!pendingToggle) return;
          toggleActive.mutate(
            { warehouseId: pendingToggle.id, isActive: true },
            { onSettled: () => setPendingToggle(null) },
          );
        }}
      />
    </>
  );
}
