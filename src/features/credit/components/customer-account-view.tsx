"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  History,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoney, formatNumber, toNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";
import { cn } from "cn";

import { useCustomerAccount } from "../hooks/use-credit";
import {
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_TONES,
  type AccountEntry,
} from "../types/credit.types";
import { AdjustAccountDialog } from "./adjust-account-dialog";
import { PaymentDialog } from "./payment-dialog";

/** La cuenta de un cliente: cuanto debe, cuanto cupo le queda y por que. */
export function CustomerAccountView({ customerId }: { customerId: string }) {
  const canManage = usePermission("credit.manage");
  const canReadSales = usePermission("sales.read");

  const [page, setPage] = useState(1);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const account = useCustomerAccount(customerId, page);

  if (account.error) {
    return <ErrorState error={account.error} onRetry={() => account.refetch()} />;
  }

  if (account.isPending || !account.data) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="shimmer h-8 w-64 rounded-lg bg-foreground/8" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="shimmer h-28 rounded-2xl bg-foreground/6" />
          ))}
        </div>
        <div className="shimmer h-64 w-full rounded-2xl bg-foreground/6" />
      </div>
    );
  }

  const data = account.data;
  const owes = toNumber(data.owes);
  const inFavor = toNumber(data.in_favor);
  const limit = toNumber(data.credit_limit);

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title={data.customer_name}
          description={data.phone ? `Tel. ${data.phone}` : "Cuenta de fiado"}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/credit">
                  <ArrowLeft aria-hidden />
                  Volver
                </Link>
              </Button>
              {canManage ? (
                <Button variant="outline" onClick={() => setAdjustOpen(true)}>
                  <Scale aria-hidden />
                  Ajustar
                </Button>
              ) : null}
              {canManage && owes > 0 ? (
                <Button onClick={() => setPaymentOpen(true)}>
                  <HandCoins aria-hidden />
                  Registrar abono
                </Button>
              ) : null}
            </div>
          }
        />
      </Reveal>

      {inFavor > 0 ? (
        <Reveal delay={0.04}>
          <GlassPanel sheen={false} className="p-4 ring-1 ring-primary/25">
            <p className="text-sm">
              <span className="font-medium">La tienda le debe {formatMoney(inFavor)}</span> a{" "}
              {data.customer_name}. Pasa al devolver una venta que ya tenia abonos. Cuando le
              entregues la plata, registralo con un ajuste.
            </p>
          </GlassPanel>
        </Reveal>
      ) : null}

      <Stagger as="section" aria-label="Saldo" className="grid gap-4 sm:grid-cols-3">
        <StaggerItem className="h-full">
          <StatCard
            label="Debe"
            icon={Wallet}
            accent={owes > 0}
            value={owes}
            format={formatMoney}
            hint={owes > 0 ? "Saldo pendiente" : "Esta al dia"}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Cupo disponible"
            icon={ShieldCheck}
            value={toNumber(data.available_credit)}
            unavailable={data.available_credit === null}
            format={formatMoney}
            hint={limit > 0 ? `De un cupo de ${formatMoney(limit)}` : "Sin tope de fiado"}
          />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard
            label="Movimientos"
            icon={History}
            value={data.total_entries}
            format={formatNumber}
            hint="En el historial de la cuenta"
          />
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.14}>
        <SectionPanel
          title="Historial"
          action={
            data.pages > 1 ? (
              <div className="flex items-center gap-1">
                <span className="tnum mr-2 text-xs text-muted-foreground">
                  Pagina {data.page} de {data.pages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Pagina anterior"
                  disabled={data.page <= 1 || account.isFetching}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Pagina siguiente"
                  disabled={data.page >= data.pages || account.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            ) : null
          }
        >
          {data.entries.length === 0 ? (
            <EmptyState
              icon={History}
              title="Sin movimientos"
              description="Las ventas fiadas, los abonos y los ajustes de este cliente apareceran aqui."
            />
          ) : (
            <ul className="divide-y divide-white/40 dark:divide-white/6">
              {data.entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} linkSale={canReadSales} />
              ))}
            </ul>
          )}
        </SectionPanel>
      </Reveal>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        customerId={customerId}
        customerName={data.customer_name}
        owes={owes}
      />
      <AdjustAccountDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        customerId={customerId}
        customerName={data.customer_name}
        inFavor={inFavor}
      />
    </>
  );
}

function EntryRow({ entry, linkSale }: { entry: AccountEntry; linkSale: boolean }) {
  const amount = toNumber(entry.amount);
  const fromSale =
    linkSale &&
    entry.reference_id &&
    (entry.entry_type === "SALE" || entry.entry_type === "SALE_REVERSED");

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={ENTRY_TYPE_LABELS[entry.entry_type]}
            tone={ENTRY_TYPE_TONES[entry.entry_type]}
          />
          <span className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
        </div>
        {/* El backend anota las ventas con su propio tipo; repetirlo no dice nada. */}
        {entry.notes && entry.notes !== ENTRY_TYPE_LABELS[entry.entry_type] ? (
          <p className="text-sm text-muted-foreground">{entry.notes}</p>
        ) : null}
        {fromSale ? (
          <Link
            href={`/sales/${entry.reference_id}`}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Ver venta {entry.reference_id?.slice(0, 8)}
          </Link>
        ) : null}
      </div>
      {/* Con signo explicito: + debe mas, - debe menos. */}
      <span
        className={cn(
          "tnum shrink-0 text-sm font-medium",
          amount > 0 ? "text-warning" : "text-success",
        )}
      >
        {amount > 0 ? "+" : "-"}
        {formatMoney(Math.abs(amount))}
      </span>
    </li>
  );
}
