"use client";

import { AlertTriangle, PackageSearch, Warehouse } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { RankedBars } from "@/components/shared/ranked-bars";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMoney,
  formatNumber,
  formatQuantity,
  toNumber,
} from "@/lib/format";

import { useInventoryValuation, useLowStock, useSalesReport } from "../hooks/use-reports";
import { SALES_RANGES, type SalesRange } from "../types/reports.types";

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="shimmer h-9 w-full rounded-xl bg-foreground/6" />
      ))}
    </div>
  );
}

export function ReportsView() {
  const [range, setRange] = useState<SalesRange>("30");

  const sales = useSalesReport(range);
  const valuation = useInventoryValuation();
  const lowStock = useLowStock();

  const summary = sales.data?.summary;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Informes"
          description="Todo lo que se ve aqui lo calcula el servidor. Las ventas cuentan solo las completadas."
          actions={
            <Select value={range} onValueChange={(value) => setRange(value as SalesRange)}>
              <SelectTrigger className="w-48" aria-label="Rango de fechas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_RANGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </Reveal>

      <Stagger as="section" aria-label="Ventas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem className="h-full">
          <StatCard
            label="Ingresos"
            accent
            loading={sales.isPending}
            value={toNumber(summary?.revenue)}
            format={formatMoney}
            hint="Ventas completadas del periodo"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Ventas"
            loading={sales.isPending}
            value={summary?.sales_count ?? 0}
            format={formatNumber}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Ticket medio"
            loading={sales.isPending}
            value={toNumber(summary?.average_ticket)}
            format={formatMoney}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Descuentos"
            loading={sales.isPending}
            value={toNumber(summary?.discount)}
            format={formatMoney}
            hint="Lo que se dejo de cobrar"
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal delay={0.1}>
          <SectionPanel title="Productos mas vendidos">
            {sales.isPending ? (
              <PanelSkeleton />
            ) : sales.error ? (
              <ErrorState error={sales.error} onRetry={() => sales.refetch()} />
            ) : (sales.data?.top_products.length ?? 0) === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="Sin ventas en el periodo"
                description="Prueba con un rango mas amplio."
              />
            ) : (
              <RankedBars
                shareLabel="de los ingresos del periodo"
                items={(sales.data?.top_products ?? []).map((product) => ({
                  id: product.product_id,
                  label: product.product_name,
                  sublabel: product.sku,
                  value: toNumber(product.revenue),
                  display: formatMoney(product.revenue),
                }))}
              />
            )}
          </SectionPanel>
        </Reveal>

        <Reveal delay={0.16}>
          <SectionPanel title="Valoracion del inventario">
            {valuation.isPending ? (
              <PanelSkeleton rows={3} />
            ) : valuation.error ? (
              <ErrorState error={valuation.error} onRetry={() => valuation.refetch()} />
            ) : (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <GlassPanel variant="thin" sheen={false} className="rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      A coste
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">
                      {formatMoney(valuation.data?.total_cost_value)}
                    </p>
                  </GlassPanel>
                  <GlassPanel variant="thin" sheen={false} className="rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      A precio de venta
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">
                      {formatMoney(valuation.data?.total_retail_value)}
                    </p>
                  </GlassPanel>
                </div>

                <p className="tnum text-sm text-muted-foreground">
                  {formatQuantity(valuation.data?.total_units)} unidades en total
                </p>

                {(valuation.data?.warehouses.length ?? 0) === 0 ? (
                  <EmptyState icon={Warehouse} title="Sin existencias" />
                ) : (
                  <ul className="divide-y divide-white/40 border-t border-white/40 dark:divide-white/6 dark:border-white/6">
                    {valuation.data?.warehouses.map((warehouse) => (
                      <li
                        key={warehouse.warehouse_id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm">{warehouse.warehouse_name}</p>
                          <p className="tnum truncate text-xs text-muted-foreground">
                            {formatQuantity(warehouse.units)} unidades
                          </p>
                        </div>
                        <span className="tnum shrink-0 text-sm font-medium">
                          {formatMoney(warehouse.cost_value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </SectionPanel>
        </Reveal>
      </div>

      <Reveal delay={0.22}>
        <SectionPanel
          title="Bajo minimo"
          action={
            lowStock.data && lowStock.data.total > 0 ? (
              <Badge variant="outline" className="border-warning/50 font-normal text-warning">
                {formatNumber(lowStock.data.total)} productos
              </Badge>
            ) : null
          }
        >
          {lowStock.isPending ? (
            <PanelSkeleton />
          ) : lowStock.error ? (
            <ErrorState error={lowStock.error} onRetry={() => lowStock.refetch()} />
          ) : lowStock.data?.items.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Nada por debajo del minimo"
              description="Todos los productos con umbral definido estan por encima."
            />
          ) : (
            <ul className="divide-y divide-white/40 dark:divide-white/6">
              {lowStock.data?.items.map((row) => (
                <li
                  key={`${row.product_id}-${row.warehouse_id ?? "all"}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.product_name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {row.sku}
                      {row.warehouse_name ? ` - ${row.warehouse_name}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-sm font-medium text-warning">
                      {formatQuantity(row.quantity)}
                    </p>
                    <p className="tnum text-xs text-muted-foreground">
                      minimo {formatQuantity(row.min_stock)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>
      </Reveal>
    </>
  );
}
