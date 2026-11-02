"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Play,
  Plus,
  Power,
  PowerOff,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { RowActions } from "@/components/shared/row-actions";
import { ActiveBadge, StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDocument } from "@/config/documents";
import { roleLabel } from "@/config/permissions";
import { initials } from "@/features/auth/types/auth.types";
import { memberRole, type CompanyMember } from "@/features/companies/types/company.types";
import { formatDate, formatDateTime, formatMoney, formatNumber, formatQuantity } from "@/lib/format";
import { GlassPanel } from "@/components/shared/glass-panel";

import {
  useAdminCompany,
  useAdminCompanyMembers,
  useAssignSubscription,
  useChangeAdminCompanyMemberRole,
  useCompanyOverview,
  useCompanySubscription,
  usePlans,
  useUpdateAdminCompany,
} from "../hooks/use-platform";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  USAGE_LABELS,
  type SubscriptionStatus,
} from "../types/platform.types";
import { AdminChangeMemberRoleDialog, AdminMemberDialog } from "./admin-member-dialog";
import { CompanyStatusBadge } from "./company-status-badge";
import { CompanyOnboardingDialog } from "./company-onboarding-dialog";

const STATUS_TONES: Record<SubscriptionStatus, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIALING: "warning",
  PAST_DUE: "danger",
  CANCELLED: "neutral",
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/40 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 dark:border-white/6">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{value}</dd>
    </div>
  );
}

export function AdminCompanyDetail({ companyId }: { companyId: string }) {
  const company = useAdminCompany(companyId);
  const members = useAdminCompanyMembers(companyId);
  const subscription = useCompanySubscription(companyId);
  const plans = usePlans(true);
  const updateCompany = useUpdateAdminCompany();
  const assign = useAssignSubscription();
  const changeMemberRole = useChangeAdminCompanyMemberRole(companyId);

  const overview = useCompanyOverview(companyId);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [promoting, setPromoting] = useState<CompanyMember | null>(null);
  const [periodDays, setPeriodDays] = useState("30");
  /*
   * El formulario parte de lo que la empresa ya tiene. Se guarda solo lo que
   * el usuario cambia y el resto se deriva: sincronizarlo con un efecto
   * provocaria un render en cascada cada vez que llegara la suscripcion.
   */
  const [planCodeEdit, setPlanCode] = useState<string | null>(null);
  const [statusEdit, setStatus] = useState<SubscriptionStatus | null>(null);

  const currentPlan = useMemo(
    () => plans.data?.find((plan) => plan.id === subscription.data?.plan_id) ?? null,
    [plans.data, subscription.data],
  );

  const planCode = planCodeEdit ?? currentPlan?.code ?? "";
  const status = statusEdit ?? subscription.data?.status ?? "ACTIVE";

  if (company.error) {
    return <ErrorState error={company.error} onRetry={() => company.refetch()} />;
  }

  if (company.isPending || !company.data) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="shimmer h-8 w-64 rounded-lg bg-foreground/8" />
        <div className="shimmer h-64 w-full rounded-2xl bg-foreground/6" />
      </div>
    );
  }

  const data = company.data;
  const isActive = data.status === "ACTIVE";

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title={data.name}
          description={`Alta el ${formatDate(data.created_at)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/admin/companies">
                  <ArrowLeft aria-hidden />
                  Volver
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setOnboardingOpen(true)}>
                <Upload aria-hidden />
                Carga inicial
              </Button>
              {isActive ? (
                <Button variant="outline" onClick={() => setConfirmSuspend(true)}>
                  <Power aria-hidden />
                  Suspender
                </Button>
              ) : (
                <Button
                  disabled={updateCompany.isPending}
                  onClick={() => updateCompany.mutate({ companyId, input: { status: "ACTIVE" } })}
                >
                  {updateCompany.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Play aria-hidden />
                  )}
                  Reactivar
                </Button>
              )}
            </div>
          }
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal delay={0.08} className="lg:col-span-3">
          <div className="space-y-4">
            <SectionPanel title="Datos">
              <dl>
                <Row label="Estado" value={<CompanyStatusBadge status={data.status} />} />
                <Row label="Razon social" value={data.legal_name ?? "-"} />
                <Row
                  label="Documento"
                  value={formatDocument(data.document_type, data.document_number)}
                />
                <Row label="Correo" value={data.email ?? "-"} />
                <Row label="Telefono" value={data.phone ?? "-"} />
                <Row
                  label="Identificador"
                  value={<span className="font-mono text-xs">{data.id}</span>}
                />
              </dl>
            </SectionPanel>

            <SectionPanel title="Actividad">
              {overview.isPending ? (
                <div className="grid grid-cols-3 gap-2 p-4" aria-hidden>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="shimmer h-16 rounded-xl bg-foreground/6" />
                  ))}
                </div>
              ) : overview.data ? (
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["Productos", formatNumber(overview.data.metrics.active_products)],
                        ["Bodegas", formatNumber(overview.data.metrics.warehouses)],
                        ["Miembros", formatNumber(overview.data.metrics.active_members)],
                        ["Clientes", formatNumber(overview.data.metrics.customers)],
                        ["Ventas 30d", formatMoney(overview.data.metrics.sales_revenue)],
                        ["Valor del stock", formatMoney(overview.data.metrics.stock_value)],
                      ] as const
                    ).map(([label, value]) => (
                      <GlassPanel
                        key={label}
                        variant="thin"
                        sheen={false}
                        className="rounded-xl p-3"
                      >
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="tnum mt-0.5 text-sm font-medium">{value}</p>
                      </GlassPanel>
                    ))}
                  </div>

                  <p className="tnum text-xs text-muted-foreground">
                    {formatQuantity(overview.data.metrics.stock_units)} unidades en stock ·{" "}
                    {overview.data.days_since_last_sale === null
                      ? "sin ventas registradas"
                      : `ultima venta hace ${formatNumber(overview.data.days_since_last_sale)} dias`}
                  </p>

                  {overview.data.usage.length > 0 ? (
                    <div className="space-y-2 border-t border-white/40 pt-4 dark:border-white/6">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Consumo del plan
                      </p>
                      {/* Los limites no bloquean en el backend: esto informa, no impide. */}
                      {overview.data.usage.map((item) => (
                        <div key={item.resource} className="flex items-center gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">
                            {USAGE_LABELS[item.resource] ?? item.resource}
                          </span>
                          <span className="tnum text-muted-foreground">
                            {formatNumber(item.used)}
                            {item.limit > 0 ? ` / ${formatNumber(item.limit)}` : " / sin limite"}
                          </span>
                          {item.over_limit ? (
                            <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </SectionPanel>

            <SectionPanel
              title={`Miembros${members.data ? ` (${members.data.length})` : ""}`}
              action={
                <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)}>
                  <Plus aria-hidden />
                  Agregar
                </Button>
              }
            >
              {members.isPending ? (
                <div className="space-y-3 p-4" aria-hidden>
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="shimmer h-10 w-full rounded-xl bg-foreground/6" />
                  ))}
                </div>
              ) : members.error ? (
                <ErrorState error={members.error} onRetry={() => members.refetch()} />
              ) : (members.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Sin miembros"
                  description="Nadie puede entrar a esta empresa. Agrega a alguien con rol de propietario o administrador."
                  action={
                    <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                      <Plus aria-hidden />
                      Agregar miembro
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-white/40 dark:divide-white/6">
                  {members.data?.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="size-9 border border-white/50 dark:border-white/10">
                        <AvatarFallback className="bg-white/60 text-xs font-medium dark:bg-white/6">
                          {initials(member.full_name) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{member.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {roleLabel(memberRole(member))}
                      </Badge>
                      {!member.is_active ? <ActiveBadge active={false} /> : null}

                      <RowActions
                        label={member.full_name}
                        actions={[
                          {
                            label: "Cambiar rol",
                            icon: Shield,
                            onSelect: () => setPromoting(member),
                          },
                          {
                            label: member.is_active ? "Desactivar" : "Reactivar",
                            icon: member.is_active ? PowerOff : Power,
                            destructive: member.is_active,
                            onSelect: () =>
                              changeMemberRole.mutate({
                                userId: member.user_id,
                                input: {
                                  role: memberRole(member),
                                  is_active: !member.is_active,
                                },
                              }),
                          },
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </SectionPanel>
          </div>
        </Reveal>

        <Reveal delay={0.14} className="lg:col-span-2">
          <SectionPanel title="Suscripcion">
            <div className="space-y-4 p-4">
              {subscription.isPending ? (
                <div className="shimmer h-20 w-full rounded-xl bg-foreground/6" aria-hidden />
              ) : subscription.data ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="font-medium">{currentPlan?.name ?? "-"}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd>
                      <StatusBadge
                        label={SUBSCRIPTION_STATUS_LABELS[subscription.data.status]}
                        tone={STATUS_TONES[subscription.data.status]}
                      />
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Precio</dt>
                    <dd className="tnum">
                      {currentPlan ? `${formatMoney(currentPlan.price_monthly)} / mes` : "-"}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Vence</dt>
                    <dd className="tnum">
                      {subscription.data.current_period_end
                        ? formatDateTime(subscription.data.current_period_end)
                        : "-"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta empresa no tiene suscripcion. Asignale un plan abajo.
                </p>
              )}

              <div className="space-y-3 border-t border-white/40 pt-4 dark:border-white/6">
                <div className="space-y-1.5">
                  <Label htmlFor="sub-plan">Plan</Label>
                  <Select value={planCode} onValueChange={setPlanCode}>
                    <SelectTrigger id="sub-plan" className="w-full">
                      <SelectValue placeholder="Elige un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.data?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.code}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sub-status">Estado</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as SubscriptionStatus)}
                    >
                      <SelectTrigger id="sub-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBSCRIPTION_STATUSES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {SUBSCRIPTION_STATUS_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sub-days">Dias del periodo</Label>
                    <Input
                      id="sub-days"
                      inputMode="numeric"
                      className="tnum"
                      value={periodDays}
                      onChange={(event) => setPeriodDays(event.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!planCode || assign.isPending}
                  onClick={() =>
                    assign.mutate({
                      companyId,
                      input: {
                        plan_code: planCode,
                        status,
                        period_days: Number(periodDays) || 30,
                      },
                    })
                  }
                >
                  {assign.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  {subscription.data ? "Actualizar suscripcion" : "Asignar plan"}
                </Button>
              </div>
            </div>
          </SectionPanel>
        </Reveal>
      </div>

      <AdminMemberDialog
        companyId={companyId}
        companyName={data.name}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />

      <AdminChangeMemberRoleDialog
        key={promoting?.id ?? "none"}
        companyId={companyId}
        member={promoting}
        onOpenChange={(open) => {
          if (!open) setPromoting(null);
        }}
      />

      <CompanyOnboardingDialog
        companyId={companyId}
        companyName={data.name}
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
      />

      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        destructive
        loading={updateCompany.isPending}
        title={`Suspender ${data.name}?`}
        description="Sus miembros dejaran de poder operar en la siguiente peticion. Los datos se conservan."
        confirmLabel="Suspender"
        onConfirm={() =>
          updateCompany.mutate(
            { companyId, input: { status: "SUSPENDED" } },
            { onSettled: () => setConfirmSuspend(false) },
          )
        }
      />
    </>
  );
}
