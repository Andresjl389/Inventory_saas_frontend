"use client";

import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { itemTotal, type CartItem } from "@/stores/cart.store";

/**
 * Lineas de un carrito de venta o de compra.
 *
 * En movil cada linea es una tarjeta con sus campos etiquetados, no una tabla
 * encogida: el formulario de una venta tiene que poder rellenarse en una
 * tablet o un telefono en el mostrador (seccion 36 de FRONTEND.md).
 */
export function CartLines({
  items,
  priceLabel,
  onUpdate,
  onRemove,
}: {
  items: CartItem[];
  priceLabel: string;
  onUpdate: (productId: string, patch: Partial<Omit<CartItem, "product">>) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <ul className="divide-y divide-white/40 dark:divide-white/6">
      {items.map((item) => (
        <li key={item.product.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.product.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {item.product.sku}
              </p>
            </div>
            <span className="tnum shrink-0 text-sm font-medium">
              {formatMoney(itemTotal(item))}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Quitar ${item.product.name}`}
              onClick={() => onRemove(item.product.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CartField
              id={`qty-${item.product.id}`}
              label="Cantidad"
              value={item.quantity}
              onChange={(quantity) => onUpdate(item.product.id, { quantity })}
            />
            <CartField
              id={`price-${item.product.id}`}
              label={priceLabel}
              value={item.unitPrice}
              onChange={(unitPrice) => onUpdate(item.product.id, { unitPrice })}
            />
            <CartField
              id={`discount-${item.product.id}`}
              label="Descuento"
              value={item.discount}
              onChange={(discount) => onUpdate(item.product.id, { discount })}
            />
            <CartField
              id={`tax-${item.product.id}`}
              label="Impuesto"
              value={item.tax}
              onChange={(tax) => onUpdate(item.product.id, { tax })}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CartField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="tnum h-8"
      />
    </div>
  );
}
