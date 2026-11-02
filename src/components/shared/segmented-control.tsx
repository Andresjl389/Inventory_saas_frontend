"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Clases del segmento activo; por defecto, el tono primario. */
  activeClassName?: string;
};

/**
 * Radiogroup con aspecto de segmentado, sobre cristal. Para elegir entre dos o
 * tres opciones que se ven todas a la vez: la direccion de un ajuste, como se
 * paga una venta.
 */
export function SegmentedControl<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: {
  id?: string;
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid gap-1 rounded-lg border border-white/50 bg-white/55 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/6",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-300",
              active
                ? (option.activeClassName ?? "bg-primary/15 font-medium text-primary")
                : "text-muted-foreground hover:bg-foreground/5",
            )}
          >
            {option.icon ? <option.icon className="size-3.5" aria-hidden /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
