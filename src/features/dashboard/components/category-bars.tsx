"use client";

import { motion, useReducedMotion } from "motion/react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber, formatPercent } from "@/lib/format";

/**
 * Distribucion de productos por categoria.
 *
 * Es UNA sola medida (cuantos productos) repartida entre categorias, asi que
 * todas las barras llevan el mismo color: pintar cada categoria de un color
 * distinto sugeriria series independientes que no existen. Sin leyenda (el
 * titulo ya nombra la medida) y con el valor en la punta de cada barra, que es
 * lo que sustituye al eje.
 *
 * El azul es el primario de la app, validado a >= 3:1 sobre la superficie de
 * cristal en claro y en oscuro.
 */
export type CategoryDatum = {
  id: string;
  name: string;
  total: number;
};

export function CategoryBars({ items }: { items: CategoryDatum[] }) {
  const reduceMotion = useReducedMotion();

  const sorted = [...items].sort((a, b) => b.total - a.total);
  const max = Math.max(...sorted.map((item) => item.total), 1);
  const sum = sorted.reduce((acc, item) => acc + item.total, 0);

  /* Una sola barra no compara nada: la cifra es el grafico. */
  const showBars = sorted.length > 1;

  return (
    <ul className="space-y-3 px-4 py-3.5">
      {sorted.map((item, index) => {
        const ratio = item.total / max;
        const share = sum > 0 ? item.total / sum : 0;

        return (
          <li key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="group/bar -mx-2 cursor-default rounded-lg px-2 py-1 transition-colors duration-300 hover:bg-foreground/4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm">{item.name}</span>
                    <span className="tnum shrink-0 text-sm font-medium">
                      {formatNumber(item.total)}
                    </span>
                  </div>

                  {showBars ? (
                    /* Carril de referencia: un tono por encima de la superficie. */
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-foreground/8">
                      <motion.div
                        className="h-full rounded-r-[4px] bg-primary"
                        initial={{ width: reduceMotion ? `${ratio * 100}%` : 0 }}
                        animate={{ width: `${Math.max(ratio * 100, item.total > 0 ? 3 : 0)}%` }}
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
                {formatPercent(share)} del catalogo clasificado
              </TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
