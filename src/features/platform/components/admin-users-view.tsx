"use client";

import { Pencil, Plus, ShieldCheck, Users, X } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { ActiveBadge, StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/features/auth/types/auth.types";
import { formatDate, formatRelative } from "@/lib/format";

import { useAdminUsers } from "../hooks/use-platform";
import {
  DEFAULT_USER_FILTERS,
  type AdminUser,
  type AdminUserFilters,
} from "../types/platform.types";
import { CreateUserDialog, EditUserDialog } from "./admin-user-dialogs";

const column = createDataTableColumns<AdminUser>();
const ALL = "all";

export function AdminUsersView() {
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_USER_FILTERS);
  const [filtersKey, setFiltersKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const users = useAdminUsers(filters);

  const updateFilters = (patch: Partial<AdminUserFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetFilters = () => {
    setFilters(DEFAULT_USER_FILTERS);
    setFiltersKey((key) => key + 1);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor((row) => `${row.first_name} ${row.last_name}`, {
          id: "name",
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Persona" />,
          cell: ({ row }) => {
            const name = `${row.original.first_name} ${row.original.last_name}`.trim();
            return (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 shrink-0 border border-white/50 dark:border-white/10">
                  <AvatarFallback className="bg-white/60 text-xs font-medium dark:bg-white/6">
                    {initials(name) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
                </div>
              </div>
            );
          },
        }),
        column.accessor("is_superuser", {
          header: () => <span>Tipo</span>,
          enableSorting: false,
          meta: { width: "10rem" },
          cell: ({ getValue }) =>
            getValue() ? (
              <StatusBadge label="Plataforma" tone="info" />
            ) : (
              <span className="text-sm text-muted-foreground">Usuario</span>
            ),
        }),
        column.accessor("is_active", {
          header: () => <span>Estado</span>,
          enableSorting: false,
          meta: { width: "7rem" },
          cell: ({ getValue }) => <ActiveBadge active={getValue()} activeLabel="Activa" inactiveLabel="Inactiva" />,
        }),
        column.accessor((row) => row.last_login_at ?? "", {
          id: "last_login",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Ultimo acceso" />
          ),
          meta: { width: "12rem" },
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {row.original.last_login_at
                ? formatRelative(row.original.last_login_at)
                : `Nunca (alta ${formatDate(row.original.created_at)})`}
            </span>
          ),
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) => (
            <RowActions
              label={row.original.email}
              actions={[
                { label: "Editar", icon: Pencil, onSelect: () => setEditing(row.original) },
              ]}
            />
          ),
        }),
      ]),
    [],
  );

  const page = users.data;
  const hasFilters =
    Boolean(filters.search) ||
    filters.is_active !== undefined ||
    filters.is_superuser !== undefined;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Usuarios"
          description="Todas las cuentas de la plataforma, pertenezcan o no a una empresa."
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden />
              Nueva cuenta
            </Button>
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <SearchInput
            key={filtersKey}
            defaultValue={filters.search ?? ""}
            onChange={(search) => updateFilters({ search })}
            placeholder="Buscar por nombre o correo..."
            label="Buscar usuarios"
            className="w-full sm:max-w-xs"
          />

          <Select
            value={filters.is_active === undefined ? ALL : String(filters.is_active)}
            onValueChange={(value) =>
              updateFilters({ is_active: value === ALL ? undefined : value === "true" })
            }
          >
            <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="true">Activas</SelectItem>
              <SelectItem value="false">Inactivas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.is_superuser === undefined ? ALL : String(filters.is_superuser)}
            onValueChange={(value) =>
              updateFilters({ is_superuser: value === ALL ? undefined : value === "true" })
            }
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los tipos</SelectItem>
              <SelectItem value="true">Administradores</SelectItem>
              <SelectItem value="false">Usuarios</SelectItem>
            </SelectContent>
          </Select>

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
          isLoading={users.isPending}
          isFetching={users.isFetching && !users.isPending}
          error={users.error}
          onRetry={() => users.refetch()}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={hasFilters ? Users : ShieldCheck}
              title={hasFilters ? "Ninguna cuenta coincide" : "Todavia no hay cuentas"}
              description={
                hasFilters ? "Prueba con otros filtros." : "Crea la primera cuenta."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus aria-hidden />
                    Nueva cuenta
                  </Button>
                )
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
                label="cuentas"
                onPageChange={(next) => updateFilters({ page: next })}
                onSizeChange={(size) => updateFilters({ size })}
              />
            ) : null
          }
        />
      </Reveal>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog
        user={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </>
  );
}
