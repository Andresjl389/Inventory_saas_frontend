import { cn } from "cn";

/**
 * Esqueletos con `shimmer`: un reflejo recorre la superficie, igual que la luz
 * sobre el cristal. Es la misma familia visual que el resto de la interfaz.
 */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-white/40 dark:divide-white/6" aria-hidden>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid items-center gap-4 px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <span
              key={columnIndex}
              className={cn(
                "shimmer h-4 rounded-md bg-foreground/8",
                columnIndex === 0 ? "w-3/4" : "w-1/2",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass rounded-2xl p-5">
          <span className="shimmer block h-3 w-24 rounded-md bg-foreground/8" />
          <span className="shimmer mt-4 block h-8 w-20 rounded-lg bg-foreground/8" />
        </div>
      ))}
    </div>
  );
}

/** Anuncio accesible mientras se carga contenido sin esqueleto propio. */
export function LoadingState({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center px-6 py-14" role="status" aria-live="polite">
      <span className="text-sm text-muted-foreground">{label}...</span>
    </div>
  );
}
