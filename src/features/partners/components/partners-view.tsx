"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Pencil, Plus, Power, PowerOff, X, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions, type RowAction } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDocument } from "@/config/documents";
import type { Paginated } from "@/lib/api/types";

import type { PartnerFormValues, PartnerInput } from "../schemas/partner.schema";
import type { Partner, PartnerCopy, PartnerFilters } from "../types/partner.types";
import { PartnerFormDialog } from "./partner-form-dialog";
import type { UseFormSetError } from "react-hook-form";

const column = createDataTableColumns<Partner>();
const ALL = "all";

/**
 * Listado de clientes o proveedores.
 *
 * Presentacion pura: no llama a la API ni conoce permisos por su cuenta. Los
 * filtros viven en quien la usa porque son los que alimentan su `useQuery`.
 */
export function PartnersView({
  copy,
  icon,
  description,
  canWrite,
  list,
  filters,
  onFiltersChange,
  onReset,
  onSubmit,
  submitting,
  onToggleActive,
  toggling,
  extraActions,
}: {
  copy: PartnerCopy;
  icon: LucideIcon;
  description: string;
  canWrite: boolean;
  list: UseQueryResult<Paginated<Partner>>;
  filters: PartnerFilters;
  onFiltersChange: (patch: Partial<PartnerFilters>) => void;
  onReset: () => void;
  onSubmit: (
    partner: Partner | null,
    values: PartnerInput,
    setError: UseFormSetError<PartnerFormValues>,
    done: () => void,
  ) => void;
  submitting: boolean;
  onToggleActive: (partner: Partner, done: () => void) => void;
  toggling: boolean;
  /** Acciones propias de clientes o proveedores, antes de editar. */
  extraActions?: (partner: Partner) => RowAction[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Partner | null>(null);
  const [filtersKey, setFiltersKey] = useState(0);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const resetAll = () => {
    onReset();
    setFiltersKey((key) => key + 1);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("name", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Nombre" />,
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDocument(row.original.document_type, row.original.document_number)}
              </p>
            </div>
          ),
        }),
        column.accessor((row) => row.email ?? "", {
          id: "contact",
          header: () => <span>Contacto</span>,
          enableSorting: false,
          cell: ({ row }) => {
            const { email, phone } = row.original;
            if (!email && !phone) return <span className="text-muted-foreground">-</span>;
            return (
              <div className="min-w-0">
                {email ? <p className="truncate text-sm">{email}</p> : null}
                {phone ? (
                  <p className="truncate text-xs text-muted-foreground">{phone}</p>
                ) : null}
              </div>
            );
          },
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
          cell: ({ getValue }) => <ActiveBadge active={getValue()} />,
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) => (
            <RowActions
              label={row.original.name}
              actions={[
                ...(extraActions?.(row.original) ?? []),
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
                      onToggleActive(row.original, () => undefined);
                    }
                  },
                },
              ]}
            />
          ),
        }),
      ]),
    [canWrite, onToggleActive, extraActions],
  );

  const page = list.data;
  const hasFilters = Boolean(filters.search) || filters.is_active !== undefined;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title={copy.plural[0].toUpperCase() + copy.plural.slice(1)}
          description={description}
          actions={
            canWrite ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden />
                {copy.newLabel}
              </Button>
            ) : null
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <SearchInput
            key={filtersKey}
            defaultValue={filters.search ?? ""}
            onChange={(search) => onFiltersChange({ search })}
            placeholder={copy.searchPlaceholder}
            label={`Buscar ${copy.plural}`}
            className="w-full sm:max-w-xs"
          />

          <Select
            value={filters.is_active === undefined ? ALL : String(filters.is_active)}
            onValueChange={(value) =>
              onFiltersChange({ is_active: value === ALL ? undefined : value === "true" })
            }
          >
            <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetAll}>
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
          isLoading={list.isPending}
          isFetching={list.isFetching && !list.isPending}
          error={list.error}
          onRetry={() => list.refetch()}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={icon}
              title={
                hasFilters
                  ? `Ningun ${copy.singular} coincide`
                  : `Todavia no hay ${copy.plural}`
              }
              description={
                hasFilters
                  ? "Prueba con otros filtros o limpia la busqueda."
                  : `Crea el primer ${copy.singular} para empezar.`
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetAll}>
                    Limpiar filtros
                  </Button>
                ) : canWrite ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus aria-hidden />
                    {copy.newLabel}
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
                label={copy.plural}
                onPageChange={(next) => onFiltersChange({ page: next })}
                onSizeChange={(size) => onFiltersChange({ size })}
              />
            ) : null
          }
        />
      </Reveal>

      <PartnerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        partner={editing}
        copy={copy}
        pending={submitting}
        onSubmit={(values, setError) =>
          onSubmit(editing, values, setError, () => setFormOpen(false))
        }
      />

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
        destructive
        loading={toggling}
        title={`Desactivar ${pendingToggle?.name}?`}
        description={`Dejara de aparecer al registrar nuevas operaciones, pero su historico se conserva. Puedes reactivar ${
          copy.singular === "cliente" ? "al cliente" : "al proveedor"
        } cuando quieras.`}
        confirmLabel="Desactivar"
        onConfirm={() => {
          if (!pendingToggle) return;
          onToggleActive(pendingToggle, () => setPendingToggle(null));
        }}
      />
    </>
  );
}
