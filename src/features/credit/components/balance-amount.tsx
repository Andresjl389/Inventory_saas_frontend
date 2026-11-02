import { formatMoney } from "@/lib/format";
import { cn } from "cn";

/**
 * Un saldo de fiado, leido sin pensar en signos.
 *
 * Positivo: el cliente debe. Negativo: la tienda le debe a el (pasa al
 * devolver una venta ya abonada), y eso se dice con palabras, no con un menos
 * que se confunde con "debe menos".
 */
export function BalanceAmount({
  balance,
  className,
}: {
  balance: number;
  className?: string;
}) {
  if (balance > 0) {
    return (
      <span className={cn("tnum font-medium text-warning", className)}>
        {formatMoney(balance)}
      </span>
    );
  }

  if (balance < 0) {
    return (
      <span className={cn("tnum font-medium text-primary", className)}>
        {formatMoney(-balance)} a favor
      </span>
    );
  }

  return <span className={cn("tnum text-muted-foreground", className)}>Al dia</span>;
}
