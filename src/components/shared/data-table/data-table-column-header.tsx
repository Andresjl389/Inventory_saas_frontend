"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "cn";

/**
 * Cabecera con orden. Se tipa de forma estructural para no arrastrar los
 * genericos de TanStack Table por cada columna.
 */
type SortableColumn = {
  getCanSort?: () => boolean;
  getIsSorted?: () => false | "asc" | "desc";
  getToggleSortingHandler?: () => ((event: unknown) => void) | undefined;
};

export function DataTableColumnHeader({
  column,
  title,
  align = "left",
  className,
}: {
  column: SortableColumn;
  title: string;
  align?: "left" | "right";
  className?: string;
}) {
  const canSort = column.getCanSort?.() ?? false;
  const sorted = column.getIsSorted?.() ?? false;

  if (!canSort) {
    return (
      <span className={cn("block", align === "right" && "text-right", className)}>{title}</span>
    );
  }

  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler?.()}
      // `aria-sort` va en el <th> (lo pone DataTable), no en el boton.
      aria-label={`Ordenar por ${title}`}
      className={cn(
        "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        align === "right" && "flex-row-reverse",
        sorted && "text-foreground",
        className,
      )}
    >
      {title}
      <Icon className={cn("size-3", !sorted && "opacity-50")} aria-hidden />
    </button>
  );
}
