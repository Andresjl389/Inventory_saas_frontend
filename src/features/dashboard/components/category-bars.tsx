"use client";

import { RankedBars } from "@/components/shared/ranked-bars";
import { formatNumber } from "@/lib/format";

export type CategoryDatum = {
  id: string;
  name: string;
  total: number;
};

/** Productos por categoria. Ver `RankedBars` para las decisiones del grafico. */
export function CategoryBars({ items }: { items: CategoryDatum[] }) {
  return (
    <RankedBars
      shareLabel="del catalogo clasificado"
      items={items.map((item) => ({
        id: item.id,
        label: item.name,
        value: item.total,
        display: formatNumber(item.total),
      }))}
    />
  );
}
