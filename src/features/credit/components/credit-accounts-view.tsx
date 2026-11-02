"use client";

import { HandCoins, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, formatNumber, formatRelative, toNumber } from "@/lib/format";

import { useCreditAccounts, useCreditSummary } from "../hooks/use-credit";
import {
  DEFAULT_ACCOUNT_FILTERS,
  type AccountFilters,
  type AccountSummary,
} from "../types/credit.types";
import { BalanceAmount } from "./balance-amount";

const column = createDataTableColumns<AccountSummary>();

/**
 * "Cuentas claras": quien debe y cuanto, el que mas debe primero.
 *
 * El orden lo pone el backend, asi que la tabla no ordena por su cuenta: una
 * pagina ordenada en el navegador mentiria sobre el resto de paginas.
 */
export function CreditAccountsView() {
  const router = useRouter();
  const [filters, setFilters] = useState<AccountFilters>(DEFAULT_ACCOUNT_FILTERS);
  const [filtersKey, setFiltersKey] = useState(0);

  const summary = useCreditSummary();
  const accounts = useCreditAccounts(filters);

  const updateFilters = (patch: Partial<AccountFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetAll = () => {
    setFilters(DEFAULT_ACCOUNT_FILTERS);
    setFiltersKey((key) => key + 1);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("customer_name", {
          header: () => <span>Cliente</span>,
          enableSorting: false,
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.customer_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.phone ?? "Sin telefono"}
              </p>
            </div>
          ),
        }),
        column.accessor((row) => toNumber(row.balance), {
          id: "balance",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Saldo" align="right" />
          ),
          enableSorting: false,
          meta: { align: "right", width: "11rem" },
          cell: ({ getValue }) => (
            <BalanceAmount balance={getValue()} className="block text-right" />
          ),
        }),
        column.accessor((row) => toNumber(row.credit_limit), {
          id: "credit_limit",
          header: () => <span className="block text-right">Cupo</span>,
          enableSorting: false,
          meta: { align: "right", width: "10rem" },
          cell: ({ getValue }) => {
            const limit = getValue();
            return (
              <span className="tnum block text-right text-muted-foreground">
                {limit > 0 ? formatMoney(limit) : "Sin tope"}
              </span>
            );
          },
        }),
        column.accessor("last_movement_at", {
          header: () => <span>Ultimo movimiento</span>,
          enableSorting: false,
          meta: { width: "11rem" },
          cell: ({ getValue }) => (
            <span className="text-sm text-muted-foreground">{formatRelative(getValue())}</span>
          ),
        }),
      ]),
    [],
  );

  const page = accounts.data;
  const hasFilters = Boolean(filters.search) || !filters.only_with_balance;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Fiado"
          description="Cuentas claras: quien te debe y cuanto. Cada peso del saldo se explica con un movimiento del historial."
        />
      </Reveal>

      <Stagger as="section" aria-label="Resumen del fiado" className="grid gap-4 sm:grid-cols-2">
        <StaggerItem className="h-full">
          <StatCard
            label="Por cobrar"
            icon={HandCoins}
            accent
            loading={summary.isPending}
            value={toNumber(summary.data?.total_receivable)}
            format={formatMoney}
            hint="Lo que te deben entre todos"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Clientes con deuda"
            icon={Users}
            loading={summary.isPending}
            value={summary.data?.customers_with_debt ?? 0}
            format={formatNumber}
            hint="Con saldo pendiente"
          />
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <SearchInput
            key={filtersKey}
            defaultValue={filters.search ?? ""}
            onChange={(search) => updateFilters({ search })}
            placeholder="Buscar por nombre o telefono..."
            label="Buscar cuentas"
            className="w-full sm:max-w-xs"
          />

          <Select
            value={filters.only_with_balance ? "debt" : "all"}
            onValueChange={(value) => updateFilters({ only_with_balance: value === "debt" })}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por saldo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debt">Con saldo</SelectItem>
              <SelectItem value="all">Todos los clientes</SelectItem>
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
          isLoading={accounts.isPending}
          isFetching={accounts.isFetching && !accounts.isPending}
          error={accounts.error}
          onRetry={() => accounts.refetch()}
          getRowId={(row) => row.customer_id}
          onRowClick={(account) => router.push(`/credit/${account.customer_id}`)}
          emptyState={
            <EmptyState
              icon={HandCoins}
              title={hasFilters ? "Ninguna cuenta coincide" : "Nadie te debe"}
              description={
                hasFilters
                  ? "Prueba con otra busqueda."
                  : "Cuando cobres una venta como fiado, el cliente aparece aqui con su saldo."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetAll}>
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
                label="cuentas"
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
