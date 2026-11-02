"use client";

import { CreditCard, Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { ActiveBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "@/lib/format";

import { usePlans } from "../hooks/use-platform";
import type { Plan } from "../types/platform.types";
import { PlanFormDialog } from "./plan-form-dialog";

/** Un limite en 0 es "sin limite": asi lo interpreta el backend. */
function limit(value: number): string {
  return value === 0 ? "Sin limite" : formatNumber(value);
}

export function AdminPlansView() {
  const plans = usePlans();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Planes"
          description="Lo que puede contratar una empresa. Los limites se aplican al usar la aplicacion."
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden />
              Nuevo plan
            </Button>
          }
        />
      </Reveal>

      {plans.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="shimmer h-56 rounded-2xl bg-foreground/6" />
          ))}
        </div>
      ) : plans.error ? (
        <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
      ) : (plans.data?.length ?? 0) === 0 ? (
        <GlassPanel sheen={false}>
          <EmptyState
            icon={CreditCard}
            title="Todavia no hay planes"
            description="Crea el primero para poder asignarlo a una empresa."
          />
        </GlassPanel>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.data?.map((plan) => (
            <StaggerItem key={plan.id} className="h-full">
              <GlassPanel interactive className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{plan.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{plan.code}</p>
                  </div>
                  <ActiveBadge active={plan.is_active} activeLabel="Activo" inactiveLabel="Inactivo" />
                </div>

                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {formatMoney(plan.price_monthly)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ mes</span>
                </p>

                {plan.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                ) : null}

                <dl className="mt-4 space-y-1.5 border-t border-white/40 pt-4 text-sm dark:border-white/6">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Usuarios</dt>
                    <dd className="tnum">{limit(plan.max_users)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Productos</dt>
                    <dd className="tnum">{limit(plan.max_products)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Bodegas</dt>
                    <dd className="tnum">{limit(plan.max_warehouses)}</dd>
                  </div>
                </dl>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setEditing(plan);
                    setFormOpen(true);
                  }}
                >
                  <Pencil aria-hidden />
                  Editar
                </Button>
              </GlassPanel>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} plan={editing} />
    </>
  );
}
