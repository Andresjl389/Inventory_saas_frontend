"use client";

import { Check, ChevronsUpDown, Loader2, Package } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format";
import { cn } from "cn";

import { useProducts } from "../hooks/use-products";
import type { Product } from "../types/product.types";

/**
 * Selector de producto con busqueda en el servidor.
 *
 * Un `<select>` normal obligaria a descargar el catalogo entero; aqui se piden
 * 20 resultados por busqueda con debounce, que es lo que aguanta un catalogo
 * de miles de referencias.
 */
export function ProductCombobox({
  value,
  onSelect,
  placeholder = "Buscar producto...",
  disabled = false,
  excludeIds,
  id,
  className,
}: {
  value: Product | null;
  onSelect: (product: Product) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Productos ya agregados: se ocultan para no duplicar lineas. */
  excludeIds?: Set<string>;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const search = useDebouncedValue(term, 350);

  const products = useProducts({ page: 1, size: 20, search, is_active: true });
  const items = (products.data?.items ?? []).filter(
    (product) => !excludeIds?.has(product.id),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? (
            <span className="min-w-0 truncate">
              {value.name}
              <span className="ml-2 font-mono text-xs text-muted-foreground">{value.sku}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        {/* `shouldFilter={false}`: filtra el backend, no cmdk. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nombre o SKU..."
            value={term}
            onValueChange={setTerm}
          />
          <CommandList>
            {products.isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Buscando...
              </div>
            ) : items.length === 0 ? (
              <CommandEmpty>
                <span className="flex flex-col items-center gap-1 py-4 text-sm">
                  <Package className="size-4 text-muted-foreground" aria-hidden />
                  Ningun producto coincide
                </span>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => {
                      onSelect(product);
                      setOpen(false);
                      setTerm("");
                    }}
                    className="gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{product.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-xs text-muted-foreground">
                      {formatMoney(product.sale_price)}
                    </span>
                    {value?.id === product.id ? (
                      <Check className="size-4 text-primary" aria-hidden />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
