"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "cn";

/**
 * Busqueda con debounce. Propaga el valor solo cuando el usuario deja de
 * escribir, asi que hay una peticion por busqueda y no por tecla.
 *
 * El input es no controlado a proposito: mantener el texto sincronizado con el
 * padre obligaria a un `setState` dentro de un efecto. Para limpiarlo desde
 * fuera, el padre cambia la prop `key` y React lo vuelve a montar.
 */
export function SearchInput({
  defaultValue = "",
  onChange,
  placeholder = "Buscar...",
  className,
  label = "Buscar",
}: {
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(defaultValue);
  const debounced = useDebouncedValue(draft, 350);

  useEffect(() => {
    onChange(debounced);
    // Solo reaccionamos al valor con debounce; `onChange` puede cambiar de
    // identidad en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        aria-label={label}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Limpiar busqueda"
          onClick={() => setDraft("")}
          className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
