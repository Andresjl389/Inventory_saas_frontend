"use client";

import { ArrowLeft, Ban, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProductDirectory } from "@/features/products/hooks/use-product-directory";
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { formatDateTime, formatMoney, formatQuantity } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { usePurchase } from "../hooks/use-purchases";
import { usePurchaseTransition } from "../hooks/use-purchase-mutations";
import { PurchaseStatusBadge } from "./purchase-status-badge";

export function PurchaseDetailView({ purchaseId }: { purchaseId: string }) {
  const canCreate = usePermission("purchases.create");
  const canCancel = usePermission("purchases.cancel");

  const purchase = usePurchase(purchaseId);
  const transition = usePurchaseTransition();
  const products = useProductDirectory();
  const warehouses = useWarehouses();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [updateCosts, setUpdateCosts] = useState(false);

  /** `PurchaseDTO` solo trae `supplier_id`; el nombre se busca aparte. */
  const suppliers = useSuppliers({ page: 1, size: 100 });
  const supplierName = useMemo(() => {
    if (!purchase.data?.supplier_id) return null;
    return (
      suppliers.data?.items.find((item) => item.id === purchase.data.supplier_id)?.name ?? null
    );
  }, [suppliers.data, purchase.data]);

  const warehouseName = useMemo(
    () => warehouses.data?.find((item) => item.id === purchase.data?.warehouse_id)?.name ?? null,
    [warehouses.data, purchase.data],
  );

  if (purchase.error) {
    return <ErrorState error={purchase.error} onRetry={() => purchase.refetch()} />;
  }

  if (purchase.isPending || !purchase.data) {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="shimmer h-8 w-64 rounded-lg bg-foreground/8" />
        <div className="shimmer h-64 w-full rounded-2xl bg-foreground/6" />
      </div>
    );
  }

  const { status } = purchase.data;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title={`Compra ${purchase.data.id.slice(0, 8)}`}
          description={formatDateTime(purchase.data.created_at)}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/purchases">
                  <ArrowLeft aria-hidden />
                  Volver
                </Link>
              </Button>

              {canCancel && (status === "DRAFT" || status === "COMPLETED") ? (
                <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                  <Ban aria-hidden />
                  Cancelar
                </Button>
              ) : null}

              {canCreate && status === "DRAFT" ? (
                <Button
                  disabled={transition.isPending}
                  onClick={() =>
                    transition.mutate({
                      purchaseId,
                      action: "complete",
                      updateProductCosts: updateCosts,
                    })
                  }
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
          <SectionPanel title={`Lineas (${purchase.data.items.length})`}>
            <ul className="divide-y divide-white/40 dark:divide-white/6">
              {purchase.data.items.map((item) => {
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
                        {formatQuantity(item.quantity)} x {formatMoney(item.unit_cost)}
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
                    <PurchaseStatusBadge status={status} />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Bodega</dt>
                  <dd className="truncate">{warehouseName ?? "-"}</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Proveedor</dt>
                  <dd className="truncate">{supplierName ?? "Sin proveedor"}</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tnum">{formatMoney(purchase.data.subtotal)}</dd>
                </div>
                {Number(purchase.data.discount) > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Descuentos</dt>
                    <dd className="tnum">-{formatMoney(purchase.data.discount)}</dd>
                  </div>
                ) : null}
                {Number(purchase.data.tax) > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Impuestos</dt>
                    <dd className="tnum">{formatMoney(purchase.data.tax)}</dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between border-t border-white/40 pt-3 dark:border-white/6">
                  <dt className="font-medium">Total</dt>
                  <dd className="tnum text-xl font-semibold tracking-tight">
                    {formatMoney(purchase.data.total)}
                  </dd>
                </div>
              </dl>
            </GlassPanel>

            {canCreate && status === "DRAFT" ? (
              <GlassPanel sheen={false} className="flex items-start gap-2 p-4">
                <Checkbox
                  id="detail-update-costs"
                  checked={updateCosts}
                  onCheckedChange={(checked) => setUpdateCosts(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="detail-update-costs" className="text-sm font-normal">
                    Al completar, actualizar el coste de los productos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cada producto tomara como coste lo pagado en esta compra.
                  </p>
                </div>
              </GlassPanel>
            ) : null}

            {purchase.data.notes ? (
              <SectionPanel title="Notas">
                <p className="p-4 text-sm text-muted-foreground">{purchase.data.notes}</p>
              </SectionPanel>
            ) : null}
          </div>
        </Reveal>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        destructive
        loading={transition.isPending}
        title="Cancelar esta compra?"
        description={
          status === "COMPLETED"
            ? "La compra queda cancelada y el stock que sumo se descuenta de la bodega."
            : "El borrador queda cancelado. No afecta al inventario porque todavia no lo habia tocado."
        }
        confirmLabel="Cancelar compra"
        cancelLabel="Volver"
        onConfirm={() =>
          transition.mutate(
            { purchaseId, action: "cancel" },
            { onSettled: () => setConfirmCancel(false) },
          )
        }
      />
    </>
  );
}
