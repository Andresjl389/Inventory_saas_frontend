"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";

const PAGE_SIZES = [10, 20, 50, 100];

/**
 * Paginacion del servidor: recibe `page`, `size`, `total` y `pages` tal como
 * los devuelve `ProductPageDTO`.
 */
export function DataTablePagination({
  page,
  size,
  total,
  pages,
  onPageChange,
  onSizeChange,
  label = "resultados",
}: {
  page: number;
  size: number;
  total: number;
  pages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  label?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <div className="flex flex-col gap-3 border-t border-white/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/6">
      <p className="tnum text-sm text-muted-foreground">
        {total === 0
          ? `Sin ${label}`
          : `${formatNumber(from)}-${formatNumber(to)} de ${formatNumber(total)} ${label}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-muted-foreground">
            Por pagina
          </label>
          <Select value={String(size)} onValueChange={(value) => onSizeChange(Number(value))}>
            <SelectTrigger id="page-size" size="sm" className="w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Pagina anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <span className="tnum px-2 text-sm text-muted-foreground" aria-live="polite">
            {page} / {Math.max(pages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Pagina siguiente"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
