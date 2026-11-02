"use client";

import { ArrowLeft, Ban, Check, Loader2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/features/credit/types/credit.types";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useProductDirectory } from "@/features/products/hooks/use-product-directory";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { formatDateTime, formatMoney, formatQuantity, toNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { useSale } from "../hooks/use-sales";
import { useSaleTransition } from "../hooks/use-sale-mutations";
import type { SaleStatus } from "../types/sale.types";
import { SaleStatusBadge } from "./sale-status-badge";

type PendingAction = { action: "cancel" | "refund"; title: string; description: string };

export function SaleDetailView({ saleId }: { saleId: string }) {
  const canCreate = usePermission("sales.create");
  const canCancel = usePermission("sales.cancel");
  const canReadCredit = usePermission("credit.read");

  const sale = useSale(saleId);
  const transition = useSaleTransition();
  const products = useProductDirectory();
  const warehouses = useWarehouses();
  const [pending, setPending] = useState<PendingAction | null>(null);

  /**
   * `SaleDTO` solo trae `customer_id`. Se busca el nombre en la primera pagina
   * de clientes; mientras el backend no lo incluya en la respuesta, un cliente
   * fuera de esa pagina se queda sin nombre.
   */
  const customers = useCustomers({ page: 1, size: 100 });
  const customerName = useMemo(() => {
    if (!sale.data?.customer_id) return null;
    return (
      customers.data?.items.find((item) => item.id === sale.data.customer_id)?.name ?? null
    );
  }, [customers.data, sale.data]);

  const warehouseName = useMemo(
    () => warehouses.data?.find((item) => item.id === sale.data?.warehouse_id)?.name ?? null,
    [warehouses.data, sale.data],
  );

  if (sale.error) {
    return <ErrorState error={sale.error} onRetry={() => sale.refetch()} />;
  }

  if (sale.isPending || !sale.data) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="shimmer h-8 w-64 rounded-lg bg-foreground/8" />
        <div className="shimmer h-64 w-full rounded-2xl bg-foreground/6" />
      </div>
    );
  }

  const { status } = sale.data;
  const outstanding = toNumber(sale.data.outstanding);
  const canComplete: SaleStatus[] = ["DRAFT"];
  const canBeCancelled: SaleStatus[] = ["DRAFT", "COMPLETED"];

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title={`Venta ${sale.data.id.slice(0, 8)}`}
          description={formatDateTime(sale.data.created_at)}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/sales">
                  <ArrowLeft aria-hidden />
                  Volver
                </Link>
              </Button>

              {canCancel && canBeCancelled.includes(status) ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setPending({
                      action: "cancel",
                      title: "Cancelar esta venta?",
                      description:
                        status === "COMPLETED"
                          ? outstanding > 0
                            ? "La venta queda cancelada, el stock vuelve a su bodega y la deuda que dejo se borra de la cuenta del cliente."
                            : "La venta queda cancelada y el stock que descontó vuelve a su bodega."
                          : "El borrador queda cancelado. No afecta al inventario porque todavia no lo habia tocado.",
                    })
                  }
                >
                  <Ban aria-hidden />
                  Cancelar
                </Button>
              ) : null}

              {canCancel && status === "COMPLETED" ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setPending({
                      action: "refund",
                      title: "Reembolsar esta venta?",
                      description:
                        outstanding > 0
                          ? "La venta queda como reembolsada, la mercancia vuelve al inventario y la deuda se borra de la cuenta del cliente. Si ya habia abonado, queda saldo a su favor."
                          : "La venta queda como reembolsada y la mercancia vuelve al inventario.",
                    })
                  }
                >
                  <Undo2 aria-hidden />
                  Reembolsar
                </Button>
              ) : null}

              {canCreate && canComplete.includes(status) ? (
                <Button
                  disabled={transition.isPending}
                  onClick={() => transition.mutate({ saleId, action: "complete" })}
                >
                  {transition.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Check aria-hidden />
                  )}
                  Completar
                </Button>
              ) : null}
            </div>
          }
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal delay={0.08} className="lg:col-span-3">
          <SectionPanel title={`Lineas (${sale.data.items.length})`}>
            <ul className="divide-y divide-white/40 dark:divide-white/6">
              {sale.data.items.map((item) => {
                const product = products.lookup(item.product_id);
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product?.name ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {item.product_id.slice(0, 8)}
                          </span>
                        )}
                      </p>
                      <p className="tnum truncate text-xs text-muted-foreground">
                        {formatQuantity(item.quantity)} x {formatMoney(item.unit_price)}
                        {Number(item.discount) > 0
                          ? ` - ${formatMoney(item.discount)} dto.`
                          : ""}
                        {Number(item.tax) > 0 ? ` + ${formatMoney(item.tax)} imp.` : ""}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-sm font-medium">
                      {formatMoney(item.total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </SectionPanel>
        </Reveal>

        <Reveal delay={0.14} className="lg:col-span-2">
          <div className="space-y-4">
            <GlassPanel sheen={false} className="p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd>
                    <SaleStatusBadge status={status} />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Bodega</dt>
                  <dd className="truncate">{warehouseName ?? "-"}</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Cliente</dt>
                  <dd className="truncate">{customerName ?? "Venta de mostrador"}</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tnum">{formatMoney(sale.data.subtotal)}</dd>
                </div>
                {Number(sale.data.discount) > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Descuentos</dt>
                    <dd className="tnum">-{formatMoney(sale.data.discount)}</dd>
                  </div>
                ) : null}
                {Number(sale.data.tax) > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Impuestos</dt>
                    <dd className="tnum">{formatMoney(sale.data.tax)}</dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between border-t border-white/40 pt-3 dark:border-white/6">
                  <dt className="font-medium">Total</dt>
                  <dd className="tnum text-xl font-semibold tracking-tight">
                    {formatMoney(sale.data.total)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Pago</dt>
                  <dd>{PAYMENT_METHOD_LABELS[sale.data.payment_method]}</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Pagado</dt>
                  <dd className="tnum">{formatMoney(sale.data.amount_paid)}</dd>
                </div>
                {outstanding > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="font-medium text-warning">Quedo debiendo</dt>
                    <dd className="tnum font-semibold text-warning">
                      {formatMoney(outstanding)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {outstanding > 0 && canReadCredit && sale.data.customer_id ? (
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/credit/${sale.data.customer_id}`}>Ver cuenta del cliente</Link>
                </Button>
              ) : null}
            </GlassPanel>

            {sale.data.notes ? (
              <SectionPanel title="Notas">
                <p className="p-4 text-sm text-muted-foreground">{sale.data.notes}</p>
              </SectionPanel>
            ) : null}
          </div>
        </Reveal>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        destructive
        loading={transition.isPending}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.action === "refund" ? "Reembolsar" : "Cancelar venta"}
        cancelLabel="Volver"
        onConfirm={() => {
          if (!pending) return;
          transition.mutate(
            { saleId, action: pending.action },
            { onSettled: () => setPending(null) },
          );
        }}
      />
    </>
  );
}
