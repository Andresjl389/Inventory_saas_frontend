import { formatMoney } from "@/lib/format";
import type { CartTotals } from "@/stores/cart.store";

/**
 * Totales del carrito.
 *
 * Es una vista previa calculada en el navegador. La cuenta que vale es la del
 * backend, que la rehace con Decimal al guardar; por eso lo dice en pantalla
 * en lugar de dar a entender que esta cifra ya es definitiva.
 */
export function CartSummary({ totals }: { totals: CartTotals }) {
  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={totals.subtotal} />
      {totals.discount > 0 ? <Row label="Descuentos" value={-totals.discount} /> : null}
      {totals.tax > 0 ? <Row label="Impuestos" value={totals.tax} /> : null}
      <div className="flex items-baseline justify-between border-t border-white/40 pt-3 dark:border-white/6">
        <dt className="font-medium">Total</dt>
        <dd className="tnum text-xl font-semibold tracking-tight">
          {formatMoney(totals.total)}
        </dd>
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tnum">{formatMoney(value)}</dd>
    </div>
  );
}
