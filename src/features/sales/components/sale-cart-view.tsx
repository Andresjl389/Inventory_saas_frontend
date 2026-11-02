"use client";

import { ArrowLeft, Banknote, HandCoins, Landmark, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { CartLines } from "@/components/shared/cart-lines";
import { CartSummary } from "@/components/shared/cart-summary";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerAccount } from "@/features/credit/hooks/use-credit";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/features/credit/types/credit.types";
import { CustomerCombobox } from "@/features/customers/components/customer-combobox";
import { ProductCombobox } from "@/features/products/components/product-combobox";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { cartTotals, itemTotal, useSaleCart } from "@/stores/cart.store";
import { formatMoney, toNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { useCreateSale } from "../hooks/use-sale-mutations";
import { salePaymentPreview } from "../lib/sale-payment";
import type { CreateSaleCommand } from "../types/sale.types";

const PAYMENT_OPTIONS = [
  { value: "CASH", label: PAYMENT_METHOD_LABELS.CASH, icon: Banknote },
  { value: "TRANSFER", label: PAYMENT_METHOD_LABELS.TRANSFER, icon: Landmark },
  {
    value: "CREDIT",
    label: PAYMENT_METHOD_LABELS.CREDIT,
    icon: HandCoins,
    activeClassName: "bg-warning/15 font-medium text-warning",
  },
] as const;

/**
 * Mostrador de venta.
 *
 * El carrito vive en Zustand para que sobreviva a moverse por la aplicacion;
 * solo al confirmar se convierte en una peticion. La validacion de stock
 * definitiva la hace el backend dentro de la transaccion: aqui solo se
 * comprueba lo que se puede comprobar sin preguntar.
 */
export function SaleCartView() {
  const router = useRouter();
  const createSale = useCreateSale();

  const items = useSaleCart((state) => state.items);
  const warehouseId = useSaleCart((state) => state.warehouseId);
  const partner = useSaleCart((state) => state.partner);
  const notes = useSaleCart((state) => state.notes);
  const addItem = useSaleCart((state) => state.addItem);
  const updateItem = useSaleCart((state) => state.updateItem);
  const removeItem = useSaleCart((state) => state.removeItem);
  const setWarehouse = useSaleCart((state) => state.setWarehouse);
  const setPartner = useSaleCart((state) => state.setPartner);
  const setNotes = useSaleCart((state) => state.setNotes);
  const clear = useSaleCart((state) => state.clear);

  /**
   * Como se paga vive aqui y no en el carrito: el carrito lo comparten ventas
   * y compras, y el pago solo existe en la venta.
   */
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paidInput, setPaidInput] = useState("");
  const canReadCredit = usePermission("credit.read");

  const totals = useMemo(() => cartTotals(items), [items]);
  const payment = useMemo(
    () =>
      salePaymentPreview({
        total: totals.total,
        method: paymentMethod,
        paidInput,
        hasCustomer: Boolean(partner),
      }),
    [totals.total, paymentMethod, paidInput, partner],
  );

  /** El cupo solo importa si algo va a quedar debiendo. */
  const account = useCustomerAccount(partner?.id ?? null, 1, {
    enabled: canReadCredit && payment.outstanding > 0,
  });
  const available =
    account.data && account.data.available_credit !== null
      ? toNumber(account.data.available_credit)
      : null;
  const exceedsLimit = available !== null && payment.outstanding > available;
  const selectedIds = useMemo(
    () => new Set(items.map((item) => item.product.id)),
    [items],
  );

  /** Lo que impide enviar. Se muestra en vez de un boton apagado sin motivo. */
  const problems = useMemo(() => {
    const found: string[] = [];
    if (!warehouseId) found.push("Elige la bodega de la que sale la mercancia.");
    if (items.length === 0) found.push("Agrega al menos un producto.");
    if (items.some((item) => toNumber(item.quantity) <= 0)) {
      found.push("Hay lineas con cantidad cero o negativa.");
    }
    if (items.some((item) => toNumber(item.unitPrice) < 0)) {
      found.push("Hay lineas con precio negativo.");
    }
    if (items.some((item) => itemTotal(item) < 0)) {
      found.push("Hay lineas donde el descuento supera el importe.");
    }
    return [...found, ...payment.problems];
  }, [items, warehouseId, payment.problems]);

  const canSubmit = problems.length === 0 && !createSale.isPending;

  const submit = (complete: boolean) => {
    if (!warehouseId) return;

    const command: CreateSaleCommand = {
      warehouse_id: warehouseId,
      customer_id: partner?.id ?? null,
      notes: notes.trim() || null,
      payment_method: paymentMethod,
      amount_paid: payment.amountPaidField,
      complete,
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: toNumber(item.quantity).toFixed(4),
        unit_price: toNumber(item.unitPrice).toFixed(4),
        discount: toNumber(item.discount).toFixed(4),
        tax: toNumber(item.tax).toFixed(4),
      })),
    };

    createSale.mutate(command, {
      onSuccess: (sale) => {
        clear();
        setPaymentMethod("CASH");
        setPaidInput("");
        router.push(`/sales/${sale.id}`);
      },
    });
  };

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Nueva venta"
          description="Agrega productos, revisa los totales y cobra. Cobrar descuenta stock al instante."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/sales">
                  <ArrowLeft aria-hidden />
                  Volver
                </Link>
              </Button>
              {items.length > 0 ? (
                <Button variant="outline" onClick={clear} disabled={createSale.isPending}>
                  <Trash2 aria-hidden />
                  Vaciar
                </Button>
              ) : null}
            </div>
          }
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal delay={0.08} className="lg:col-span-3">
          <SectionPanel
            title={`Productos${items.length > 0 ? ` (${items.length})` : ""}`}
            bodyClassName="flex flex-col"
          >
            <div className="border-b border-white/40 p-4 dark:border-white/6">
              <Label htmlFor="sale-product" className="sr-only">
                Agregar producto
              </Label>
              <ProductCombobox
                id="sale-product"
                value={null}
                excludeIds={selectedIds}
                placeholder="Buscar producto por nombre o SKU..."
                onSelect={(product) => addItem(product, String(toNumber(product.sale_price)))}
              />
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="El carrito esta vacio"
                description="Busca un producto arriba para agregarlo a la venta."
              />
            ) : (
              <CartLines
                items={items}
                priceLabel="Precio"
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            )}
          </SectionPanel>
        </Reveal>

        <Reveal delay={0.14} className="lg:col-span-2">
          <div className="space-y-4 lg:sticky lg:top-24">
            <SectionPanel title="Datos de la venta">
              <div className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sale-warehouse">
                    Bodega <span className="text-destructive">*</span>
                  </Label>
                  <WarehouseSelect
                    id="sale-warehouse"
                    className="w-full"
                    value={warehouseId}
                    onChange={setWarehouse}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-customer">Cliente</Label>
                  <CustomerCombobox
                    id="sale-customer"
                    value={partner}
                    onSelect={setPartner}
                    onClear={() => setPartner(null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional, salvo para fiar: una venta de mostrador puede no tener cliente.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-payment-method">Pago</Label>
                  <SegmentedControl
                    id="sale-payment-method"
                    label="Forma de pago"
                    value={paymentMethod}
                    options={PAYMENT_OPTIONS}
                    onChange={setPaymentMethod}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-amount-paid">Paga ahora</Label>
                  <Input
                    id="sale-amount-paid"
                    inputMode="decimal"
                    className="tnum"
                    value={paidInput}
                    onChange={(event) => setPaidInput(event.target.value)}
                    placeholder={
                      paymentMethod === "CREDIT"
                        ? "0 (todo fiado)"
                        : `${formatMoney(totals.total)} (todo)`
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {paymentMethod === "CREDIT"
                      ? "Si deja un abono inicial, escribelo; el resto queda a deber."
                      : "Vacio paga todo. Si paga una parte, el resto queda fiado."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale-notes">Notas</Label>
                  <Textarea
                    id="sale-notes"
                    rows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </div>
            </SectionPanel>

            <GlassPanel sheen={false} className="p-4">
              <CartSummary totals={totals} />

              {payment.outstanding > 0 ? (
                <dl className="mt-3 space-y-2 border-t border-white/40 pt-3 text-sm dark:border-white/6">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-muted-foreground">Paga ahora</dt>
                    <dd className="tnum">{formatMoney(payment.amountPaid)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="font-medium text-warning">Queda debiendo</dt>
                    <dd className="tnum font-semibold text-warning">
                      {formatMoney(payment.outstanding)}
                    </dd>
                  </div>
                  {partner && available !== null ? (
                    <p
                      className={
                        exceedsLimit
                          ? "text-xs text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {exceedsLimit
                        ? `Supera el cupo: a ${partner.name} solo le quedan ${formatMoney(available)}.`
                        : `Cupo disponible de ${partner.name}: ${formatMoney(available)}.`}
                    </p>
                  ) : null}
                </dl>
              ) : null}

              {problems.length > 0 ? (
                <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {problems.map((problem) => (
                    <li key={problem}>- {problem}</li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 grid gap-2">
                <Button
                  size="lg"
                  disabled={!canSubmit}
                  onClick={() => submit(true)}
                >
                  {createSale.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : null}
                  {payment.outstanding > 0 ? "Cobrar y fiar" : "Cobrar"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!canSubmit}
                  onClick={() => submit(false)}
                >
                  Guardar borrador
                </Button>
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Los totales definitivos los calcula el servidor.
              </p>
            </GlassPanel>
          </div>
        </Reveal>
      </div>
    </>
  );
}
