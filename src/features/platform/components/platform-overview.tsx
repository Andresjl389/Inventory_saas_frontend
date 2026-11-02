"use client";

import { Building2, CreditCard, ShieldCheck, UserCheck, Users } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/shared/error-state";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

import { usePlans, usePlatformStats } from "../hooks/use-platform";

export function PlatformOverview() {
  const stats = usePlatformStats();
  const plans = usePlans();

  if (stats.error) {
    return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;
  }

  const data = stats.data;
  const suspended = data?.companies_suspended ?? 0;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Resumen de la plataforma"
          description="Estado de toda la instalacion, no de una empresa concreta."
        />
      </Reveal>

      <Stagger as="section" aria-label="Metricas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem className="h-full">
          <StatCard
            label="Empresas"
            icon={Building2}
            accent
            loading={stats.isPending}
            value={data?.companies_total ?? 0}
            format={formatNumber}
            hint={`${formatNumber(data?.companies_active ?? 0)} activas`}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Suspendidas"
            icon={Building2}
            loading={stats.isPending}
            value={suspended}
            format={formatNumber}
            hint={suspended > 0 ? "Sus miembros no pueden operar" : "Ninguna suspendida"}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Usuarios"
            icon={Users}
            loading={stats.isPending}
            value={data?.users_total ?? 0}
            format={formatNumber}
            hint={`${formatNumber(data?.users_active ?? 0)} activos`}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Administradores"
            icon={ShieldCheck}
            loading={stats.isPending}
            value={data?.platform_admins ?? 0}
            format={formatNumber}
            hint="Con acceso a esta zona"
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal delay={0.12}>
          <SectionPanel
            title="Planes"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/plans">Gestionar</Link>
              </Button>
            }
          >
            {plans.isPending ? (
              <div className="space-y-3 p-4" aria-hidden>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="shimmer h-10 w-full rounded-xl bg-foreground/6" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-white/40 dark:divide-white/6">
                {plans.data?.map((plan) => (
                  <li key={plan.id} className="flex items-center gap-3 px-4 py-3">
                    <CreditCard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{plan.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {plan.code}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-xs text-muted-foreground">
                      {plan.max_users === 0 ? "Sin limite" : `${plan.max_users} usuarios`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionPanel>
        </Reveal>

        <Reveal delay={0.18}>
          <SectionPanel
            title="Acciones"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/audit">Ver auditoria</Link>
              </Button>
            }
          >
            <div className="grid gap-2 p-4">
              <Button variant="outline" asChild className="justify-start">
                <Link href="/admin/companies">
                  <Building2 aria-hidden />
                  Dar de alta una empresa
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/admin/users">
                  <UserCheck aria-hidden />
                  Crear o editar una cuenta
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/admin/plans">
                  <CreditCard aria-hidden />
                  Ajustar los planes
                </Link>
              </Button>
            </div>
          </SectionPanel>
        </Reveal>
      </div>
    </>
  );
}
