"use client";

import { motion, useReducedMotion } from "motion/react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPercent } from "@/lib/format";

/**
 * Ranking con barras proporcionales.
 *
 * Es UNA sola medida repartida entre categorias, asi que todas las barras
 * llevan el mismo color: pintar cada fila de un color distinto sugeriria
 * series independientes que no existen. Sin leyenda (el titulo ya nombra la
 * medida) y con el valor en la punta de cada barra, que es lo que sustituye al
 * eje. Con una sola fila no se dibujan barras: comparar una cosa con nada no
 * aporta, y la cifra ya es el grafico.
 *
 * El azul es el primario de la aplicacion, comprobado a >= 3:1 de contraste
 * sobre la superficie de cristal en claro y en oscuro.
 */
export type RankedDatum = {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  /** Texto ya formateado: el componente no sabe si son unidades o dinero. */
  display: string;
};

export function RankedBars({
  items,
  shareLabel = "del total",
}: {
  items: RankedDatum[];
  shareLabel?: string;
}) {
  const reduceMotion = useReducedMotion();

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((item) => item.value), 1);
  const sum = sorted.reduce((acc, item) => acc + item.value, 0);
  const showBars = sorted.length > 1;

  return (
    <ul className="space-y-3 px-4 py-3.5">
      {sorted.map((item, index) => {
        const ratio = item.value / max;
        const share = sum > 0 ? item.value / sum : 0;

        return (
          <li key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="group/bar -mx-2 cursor-default rounded-lg px-2 py-1 transition-colors duration-300 hover:bg-foreground/4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm">
                      {item.label}
                      {item.sublabel ? (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {item.sublabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="tnum shrink-0 text-sm font-medium">{item.display}</span>
                  </div>

                  {showBars ? (
                    /* Carril de referencia: un tono por encima de la superficie. */
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-foreground/8">
                      <motion.div
                        className="h-full rounded-r-[4px] bg-primary"
                        initial={{ width: reduceMotion ? `${ratio * 100}%` : 0 }}
                        animate={{ width: `${Math.max(ratio * 100, item.value > 0 ? 3 : 0)}%` }}
                        transition={{
                          duration: 0.8,
                          delay: reduceMotion ? 0 : 0.15 + index * 0.07,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {formatPercent(share)} {shareLabel}
              </TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
