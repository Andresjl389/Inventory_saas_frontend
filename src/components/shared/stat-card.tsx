"use client";

import type { LucideIcon } from "lucide-react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { AnimatedNumber } from "@/components/shared/motion/animated-number";
import { cn } from "cn";

/**
 * Metrica del panel sobre cristal. La cifra cuenta hasta su valor al entrar,
 * y mientras carga la superficie mantiene su altura con un reflejo en marcha.
 */
export function StatCard({
  label,
  value,
  format,
  hint,
  icon: Icon,
  accent = false,
  loading = false,
  unavailable = false,
  className,
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
  loading?: boolean;
  /** El rol no puede consultar el dato: se muestra un guion, no un cero. */
  unavailable?: boolean;
  className?: string;
}) {
  return (
    <GlassPanel
      interactive
      className={cn("h-full p-5", accent && "ring-1 ring-primary/25", className)}
    >
      {accent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-32 bg-[radial-gradient(60%_100%_at_50%_100%,var(--color-primary),transparent_70%)] opacity-20"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-xl border border-white/40 transition-colors dark:border-white/10",
              accent
                ? "bg-primary/12 text-primary"
                : "bg-white/40 text-muted-foreground dark:bg-white/5",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>

      {/* Sin `tnum`: a este tamano las cifras tabulares se ven sueltas. */}
      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {loading ? (
          <span className="shimmer inline-block h-8 w-20 rounded-lg bg-foreground/10 align-middle" />
        ) : unavailable ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <AnimatedNumber value={value} format={format} />
        )}
      </p>

      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </GlassPanel>
  );
}
