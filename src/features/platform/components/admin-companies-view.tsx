"use client";

import { Building2, Eye, Play, Plus, Power, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDocument } from "@/config/documents";
import {
  COMPANY_STATUS_LABELS,
  type CompanyStatus,
} from "@/features/companies/types/company.types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDate, formatMoney, formatNumber, formatRelative, toNumber } from "@/lib/format";

import { useCompanySupervision, useUpdateAdminCompany } from "../hooks/use-platform";
import {
  DEFAULT_COMPANY_FILTERS,
  SUBSCRIPTION_STATUS_LABELS,
  type AdminCompanyFilters,
  type CompanyRow,
} from "../types/platform.types";
import { CompanyStatusBadge } from "./company-status-badge";
import { ProvisionCompanyDialog } from "./provision-company-dialog";

const column = createDataTableColumns<CompanyRow>();
const ALL = "all";
const STATUSES: CompanyStatus[] = ["ACTIVE", "SUSPENDED", "INACTIVE"];

export function AdminCompaniesView() {
  const router = useRouter();
  const [filters, setFilters] = useState<AdminCompanyFilters>(DEFAULT_COMPANY_FILTERS);
  const [filtersKey, setFiltersKey] = useState(0);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [pendingSuspend, setPendingSuspend] = useState<CompanyRow | null>(null);

  const companies = useCompanySupervision(filters);
  const updateCompany = useUpdateAdminCompany();

  const updateFilters = (patch: Partial<AdminCompanyFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetFilters = () => {
    setFilters(DEFAULT_COMPANY_FILTERS);
    setFiltersKey((key) => key + 1);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor((row) => row.company.name, {
          id: "name",
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Empresa" />,
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.company.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.company.legal_name ??
                  formatDocument(
                    row.original.company.document_type,
                    row.original.company.document_number,
                  )}
              </p>
            </div>
          ),
        }),
        column.accessor((row) => row.plan_code ?? "", {
          id: "plan",
          header: () => <span>Plan</span>,
          enableSorting: false,
          meta: { width: "10rem" },
          cell: ({ row }) => {
            const { plan_code: plan, subscription_status: status } = row.original;
            if (!plan) return <span className="text-muted-foreground">Sin plan</span>;
            return (
              <div className="min-w-0">
                <p className="truncate text-sm">{plan}</p>
                {status ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {SUBSCRIPTION_STATUS_LABELS[status]}
                  </p>
                ) : null}
              </div>
            );
          },
        }),
        column.accessor((row) => row.metrics?.active_products ?? 0, {
          id: "catalog",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Catalogo" align="right" />
          ),
          meta: { align: "right", width: "8rem" },
          cell: ({ row }) => {
            const metrics = row.original.metrics;
            if (!metrics) return <span className="block text-right text-muted-foreground">-</span>;
            return (
              <div className="text-right">
                <p className="tnum text-sm">{formatNumber(metrics.active_products)}</p>
                <p className="tnum text-xs text-muted-foreground">
                  {formatNumber(metrics.active_members)} usuarios
                </p>
              </div>
            );
          },
        }),
        column.accessor((row) => toNumber(row.metrics?.sales_revenue), {
          id: "revenue",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Ventas 30d" align="right" />
          ),
          meta: { align: "right", width: "11rem" },
          cell: ({ row }) => {
            const metrics = row.original.metrics;
            if (!metrics) return <span className="block text-right text-muted-foreground">-</span>;
            return (
              <div className="text-right">
                <p className="tnum text-sm font-medium">{formatMoney(metrics.sales_revenue)}</p>
                <p className="tnum text-xs text-muted-foreground">
                  {metrics.last_sale_at
                    ? formatRelative(metrics.last_sale_at)
                    : "sin ventas"}
                </p>
              </div>
            );
          },
        }),
        column.accessor((row) => row.company.status, {
          id: "status",
          header: () => <span>Estado</span>,
          enableSorting: false,
          meta: { width: "8rem" },
          cell: ({ row }) => <CompanyStatusBadge status={row.original.company.status} />,
        }),
        column.accessor((row) => row.company.created_at, {
          id: "created",
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Alta" />,
          meta: { width: "8rem" },
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{formatDate(getValue())}</span>
          ),
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) => (
            <RowActions
              label={row.original.company.name}
              actions={[
                {
                  label: "Ver detalle",
                  icon: Eye,
                  onSelect: () => router.push(`/admin/companies/${row.original.company.id}`),
                },
                row.original.company.status === "ACTIVE"
                  ? {
                      label: "Suspender",
                      icon: Power,
                      destructive: true,
                      onSelect: () => setPendingSuspend(row.original),
                    }
                  : {
                      label: "Reactivar",
                      icon: Play,
                      onSelect: () =>
                        updateCompany.mutate({
                          companyId: row.original.company.id,
                          input: { status: "ACTIVE" },
                        }),
                    },
              ]}
            />
          ),
        }),
      ]),
    [router, updateCompany],
  );

  const page = companies.data;
  const hasFilters = Boolean(filters.search) || Boolean(filters.status);

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Empresas"
          description="Todas las empresas de la instalacion. Suspender una corta el acceso a sus miembros en la siguiente peticion."
          actions={
            <Button onClick={() => setProvisionOpen(true)}>
              <Plus aria-hidden />
              Nueva empresa
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
            placeholder="Buscar por nombre o documento..."
            label="Buscar empresas"
            className="w-full sm:max-w-xs"
          />

          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) =>
              updateFilters({ status: value === ALL ? null : (value as CompanyStatus) })
            }
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {COMPANY_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Las metricas obligan al backend a entrar empresa por empresa. */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="with-metrics"
              checked={filters.with_metrics}
              onCheckedChange={(checked) => updateFilters({ with_metrics: checked === true })}
            />
            <Label htmlFor="with-metrics" className="text-sm font-normal text-muted-foreground">
              Incluir metricas
            </Label>
          </div>

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
          isLoading={companies.isPending}
          isFetching={companies.isFetching && !companies.isPending}
          error={companies.error}
          onRetry={() => companies.refetch()}
          getRowId={(row) => row.company.id}
          onRowClick={(row) => router.push(`/admin/companies/${row.company.id}`)}
          emptyState={
            <EmptyState
              icon={Building2}
              title={hasFilters ? "Ninguna empresa coincide" : "Todavia no hay empresas"}
              description={
                hasFilters
                  ? "Prueba con otros filtros."
                  : "Da de alta la primera empresa de la plataforma."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setProvisionOpen(true)}>
                    <Plus aria-hidden />
                    Nueva empresa
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
                label="empresas"
                onPageChange={(next) => updateFilters({ page: next })}
                onSizeChange={(size) => updateFilters({ size })}
              />
            ) : null
          }
        />
      </Reveal>

      <ProvisionCompanyDialog open={provisionOpen} onOpenChange={setProvisionOpen} />

      <ConfirmDialog
        open={Boolean(pendingSuspend)}
        onOpenChange={(open) => {
          if (!open) setPendingSuspend(null);
        }}
        destructive
        loading={updateCompany.isPending}
        title={`Suspender ${pendingSuspend?.company.name}?`}
        description="Sus miembros dejaran de poder operar en la siguiente peticion. Los datos se conservan y puedes reactivarla cuando quieras."
        confirmLabel="Suspender"
        onConfirm={() => {
          if (!pendingSuspend) return;
          updateCompany.mutate(
            { companyId: pendingSuspend.company.id, input: { status: "SUSPENDED" } },
            { onSettled: () => setPendingSuspend(null) },
          );
        }}
      />
    </>
  );
}
