"use client";

import { ArrowLeft, Loader2, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CartLines } from "@/components/shared/cart-lines";
import { CartSummary } from "@/components/shared/cart-summary";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductCombobox } from "@/features/products/components/product-combobox";
import { SupplierCombobox } from "@/features/suppliers/components/supplier-combobox";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { toNumber } from "@/lib/format";
import { cartTotals, itemTotal, usePurchaseCart } from "@/stores/cart.store";

import { useCreatePurchase } from "../hooks/use-purchase-mutations";
import type { CreatePurchaseCommand } from "../types/purchase.types";

/**
 * Entrada de mercancia.
 *
 * Igual que el mostrador de venta, pero con el coste en lugar del precio y con
 * la opcion de que al completar se refresque el `cost_price` del producto.
 */
export function PurchaseCartView() {
  const router = useRouter();
  const createPurchase = useCreatePurchase();
  const [updateCosts, setUpdateCosts] = useState(false);

  const items = usePurchaseCart((state) => state.items);
  const warehouseId = usePurchaseCart((state) => state.warehouseId);
  const partner = usePurchaseCart((state) => state.partner);
  const notes = usePurchaseCart((state) => state.notes);
  const addItem = usePurchaseCart((state) => state.addItem);
  const updateItem = usePurchaseCart((state) => state.updateItem);
  const removeItem = usePurchaseCart((state) => state.removeItem);
  const setWarehouse = usePurchaseCart((state) => state.setWarehouse);
  const setPartner = usePurchaseCart((state) => state.setPartner);
  const setNotes = usePurchaseCart((state) => state.setNotes);
  const clear = usePurchaseCart((state) => state.clear);

  const totals = useMemo(() => cartTotals(items), [items]);
  const selectedIds = useMemo(() => new Set(items.map((item) => item.product.id)), [items]);

  const problems = useMemo(() => {
    const found: string[] = [];
    if (!warehouseId) found.push("Elige la bodega que recibe la mercancia.");
    if (items.length === 0) found.push("Agrega al menos un producto.");
    if (items.some((item) => toNumber(item.quantity) <= 0)) {
      found.push("Hay lineas con cantidad cero o negativa.");
    }
    if (items.some((item) => toNumber(item.unitPrice) < 0)) {
      found.push("Hay lineas con coste negativo.");
    }
    if (items.some((item) => itemTotal(item) < 0)) {
      found.push("Hay lineas donde el descuento supera el importe.");
    }
    return found;
  }, [items, warehouseId]);

  const canSubmit = problems.length === 0 && !createPurchase.isPending;

  const submit = (complete: boolean) => {
    if (!warehouseId) return;

    const command: CreatePurchaseCommand = {
      warehouse_id: warehouseId,
      supplier_id: partner?.id ?? null,
      notes: notes.trim() || null,
      complete,
      update_product_costs: updateCosts,
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: toNumber(item.quantity).toFixed(4),
        unit_cost: toNumber(item.unitPrice).toFixed(4),
        discount: toNumber(item.discount).toFixed(4),
        tax: toNumber(item.tax).toFixed(4),
      })),
    };

    createPurchase.mutate(command, {
      onSuccess: (purchase) => {
        clear();
        router.push(`/purchases/${purchase.id}`);
      },
    });
  };

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Nueva compra"
          description="Agrega lo que recibes y a que coste. Completarla suma stock a la bodega."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/purchases">
                  <ArrowLeft aria-hidden />
                  Volver
                </Link>
              </Button>
              {items.length > 0 ? (
                <Button variant="outline" onClick={clear} disabled={createPurchase.isPending}>
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
              <Label htmlFor="purchase-product" className="sr-only">
                Agregar producto
              </Label>
              <ProductCombobox
                id="purchase-product"
                value={null}
                excludeIds={selectedIds}
                placeholder="Buscar producto por nombre o SKU..."
                onSelect={(product) => addItem(product, String(toNumber(product.cost_price)))}
              />
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="La compra esta vacia"
                description="Busca un producto arriba para agregarlo."
              />
            ) : (
              <CartLines
                items={items}
                priceLabel="Coste"
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            )}
          </SectionPanel>
        </Reveal>

        <Reveal delay={0.14} className="lg:col-span-2">
          <div className="space-y-4 lg:sticky lg:top-24">
            <SectionPanel title="Datos de la compra">
              <div className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="purchase-warehouse">
                    Bodega <span className="text-destructive">*</span>
                  </Label>
                  <WarehouseSelect
                    id="purchase-warehouse"
                    className="w-full"
                    value={warehouseId}
                    onChange={setWarehouse}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchase-supplier">Proveedor</Label>
                  <SupplierCombobox
                    id="purchase-supplier"
                    value={partner}
                    onSelect={setPartner}
                    onClear={() => setPartner(null)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchase-notes">Notas</Label>
                  <Textarea
                    id="purchase-notes"
                    rows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                  <Checkbox
                    id="update-costs"
                    checked={updateCosts}
                    onCheckedChange={(checked) => setUpdateCosts(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="update-costs" className="text-sm font-normal">
                      Actualizar el coste de los productos
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Al completar, cada producto toma como coste lo que se pago aqui. Dejalo
                      apagado si llevas un promedio ponderado.
                    </p>
                  </div>
                </div>
              </div>
            </SectionPanel>

            <GlassPanel sheen={false} className="p-4">
              <CartSummary totals={totals} />

              {problems.length > 0 ? (
                <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {problems.map((problem) => (
                    <li key={problem}>- {problem}</li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 grid gap-2">
                <Button size="lg" disabled={!canSubmit} onClick={() => submit(true)}>
                  {createPurchase.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : null}
                  Registrar y recibir
                </Button>
                <Button variant="outline" disabled={!canSubmit} onClick={() => submit(false)}>
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
