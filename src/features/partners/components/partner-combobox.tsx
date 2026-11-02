"use client";

import { Check, ChevronsUpDown, Loader2, UserRound, X } from "lucide-react";
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
import { formatDocument } from "@/config/documents";
import { cn } from "cn";

import type { Partner } from "../types/partner.types";

/**
 * Selector de cliente o proveedor con busqueda en el servidor.
 *
 * Presentacional: recibe los resultados ya cargados. Quien lo usa decide de
 * que endpoint vienen, que es lo unico que diferencia a un cliente de un
 * proveedor.
 */
export function PartnerCombobox({
  value,
  items,
  loading,
  term,
  onTermChange,
  onSelect,
  onClear,
  placeholder,
  emptyLabel,
  id,
}: {
  value: Partner | null;
  items: Partner[];
  loading: boolean;
  term: string;
  onTermChange: (term: string) => void;
  onSelect: (partner: Partner) => void;
  onClear?: () => void;
  placeholder: string;
  emptyLabel: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-0 flex-1 justify-between font-normal"
          >
            {value ? (
              <span className="min-w-0 truncate">{value.name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          {/* Filtra el backend, no cmdk. */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Nombre o documento..."
              value={term}
              onValueChange={onTermChange}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Buscando...
                </div>
              ) : items.length === 0 ? (
                <CommandEmpty>
                  <span className="flex flex-col items-center gap-1 py-4 text-sm">
                    <UserRound className="size-4 text-muted-foreground" aria-hidden />
                    {emptyLabel}
                  </span>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {items.map((partner) => (
                    <CommandItem
                      key={partner.id}
                      value={partner.id}
                      onSelect={() => {
                        onSelect(partner);
                        setOpen(false);
                        onTermChange("");
                      }}
                      className="gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{partner.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDocument(partner.document_type, partner.document_number)}
                        </p>
                      </div>
                      {value?.id === partner.id ? (
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

      {value && onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Quitar seleccion"
          onClick={onClear}
          className={cn("shrink-0")}
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
