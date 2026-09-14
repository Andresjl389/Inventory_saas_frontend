"use client";

import { Boxes, PackageCheck, PackageX, Tags, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useCompanyMembers } from "@/features/companies/hooks/use-company-members";
import { useProductCount } from "@/features/products/hooks/use-product-counts";
import { useProducts } from "@/features/products/hooks/use-products";
import { formatMoney, formatNumber, formatRelative } from "@/lib/format";
import { usePermission, useSession } from "@/providers/session-provider";
import { useTenant } from "@/stores/tenant.store";

import { useCategoryBreakdown } from "../hooks/use-category-breakdown";
import { CategoryBars } from "./category-bars";

function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="shimmer h-9 w-full rounded-xl bg-foreground/6" />
      ))}
    </div>
  );
}

export function DashboardView() {
  const { user } = useSession();
  const { companyName } = useTenant();
  const canReadMembers = usePermission("members.read");

  const activeProducts = useProductCount("active");
  const inactiveProducts = useProductCount("inactive");
  const categories = useCategories();
  const members = useCompanyMembers({ enabled: canReadMembers });
  const recent = useProducts({ page: 1, size: 5, is_active: true });
  const breakdown = useCategoryBreakdown();

  return (
    <>
      <Reveal as="header">
        <PageHeader title={`Hola, ${user.first_name}`} description={`Resumen de ${companyName}.`} />
      </Reveal>

      <Stagger
        as="section"
        aria-label="Metricas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StaggerItem className="h-full">
          <StatCard
            label="Productos activos"
            icon={PackageCheck}
            accent
            loading={activeProducts.isPending}
            value={activeProducts.data ?? 0}
            format={formatNumber}
            hint="Disponibles para operar"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Productos inactivos"
            icon={PackageX}
            loading={inactiveProducts.isPending}
            value={inactiveProducts.data ?? 0}
            format={formatNumber}
            hint="Se conservan en el historico"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Categorias"
            icon={Tags}
            loading={categories.isPending}
            value={categories.data?.length ?? 0}
            format={formatNumber}
            hint="Grupos del catalogo"
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Equipo"
            icon={Users}
            loading={canReadMembers && members.isPending}
            unavailable={!canReadMembers}
            value={members.data?.length ?? 0}
            format={formatNumber}
            hint={canReadMembers ? "Miembros con acceso" : "Tu rol no puede verlo"}
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal delay={0.12} as="section" aria-label="Productos recientes" className="lg:col-span-3">
          <SectionPanel
            title="Productos recientes"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products">Ver todos</Link>
              </Button>
            }
          >
            {recent.isPending ? (
              <RowsSkeleton />
            ) : recent.error ? (
              <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
            ) : (recent.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Aun no hay productos"
                description="Cuando crees el primero aparecera aqui."
                action={
                  <Button size="sm" asChild>
                    <Link href="/products">Ir a productos</Link>
                  </Button>
                }
              />
            ) : (
              <Stagger as="ul" className="divide-y divide-white/40 dark:divide-white/6">
                {recent.data?.items.map((product) => (
                  <StaggerItem
                    key={product.id}
                    as="li"
                    variant="fade"
                    className="flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-foreground/4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-sm">{formatMoney(product.sale_price)}</span>
                    <span className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground sm:block">
                      {formatRelative(product.created_at)}
                    </span>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </SectionPanel>
        </Reveal>

        <Reveal
          delay={0.18}
          as="section"
          aria-label="Catalogo por categoria"
          className="lg:col-span-2"
        >
          <SectionPanel
            title="Por categoria"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/categories">Gestionar</Link>
              </Button>
            }
          >
            {breakdown.isPending ? (
              <RowsSkeleton />
            ) : breakdown.error ? (
              <ErrorState error={breakdown.error} />
            ) : breakdown.items.length === 0 ? (
              <EmptyState icon={Tags} title="Sin categorias" />
            ) : (
              <>
                <CategoryBars items={breakdown.items} />
                {breakdown.truncated ? (
                  <p className="border-t border-white/40 px-4 py-2 text-xs text-muted-foreground dark:border-white/8">
                    Se muestran las primeras 8 categorias.
                  </p>
                ) : null}
              </>
            )}
          </SectionPanel>
        </Reveal>
      </div>

      <Reveal delay={0.24}>
        <p className="text-xs text-muted-foreground">
          Las metricas de ventas, stock y valoracion llegaran cuando el backend exponga los modulos
          de inventario y ventas.
        </p>
      </Reveal>
    </>
  );
}
