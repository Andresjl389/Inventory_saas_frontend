"use client";

import { useCallback, useRef, type ReactNode } from "react";

import { cn } from "cn";

/**
 * Superficie de cristal con reflejo especular que sigue al puntero.
 *
 * Es el detalle que separa "cristal" de "caja con desenfoque": la luz se mueve
 * sobre el material. Se actualiza escribiendo variables CSS en el nodo, sin
 * pasar por el estado de React, para no re-renderizar en cada pixel del raton.
 */
export function GlassPanel({
  children,
  className,
  variant = "regular",
  interactive = false,
  sheen = true,
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: "regular" | "thick" | "thin";
  interactive?: boolean;
  sheen?: boolean;
} & React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!sheen) return;
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      element.style.setProperty("--sheen-x", `${event.clientX - rect.left}px`);
      element.style.setProperty("--sheen-y", `${event.clientY - rect.top}px`);
      element.style.setProperty("--sheen-opacity", "1");
    },
    [sheen],
  );

  const handlePointerLeave = useCallback(() => {
    ref.current?.style.setProperty("--sheen-opacity", "0");
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl",
        variant === "thick" ? "glass-thick" : variant === "thin" ? "glass-thin" : "glass",
        interactive && "glass-interactive",
        className,
      )}
      {...props}
    >
      {sheen ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-[var(--sheen-opacity,0)] transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(16rem 16rem at var(--sheen-x, 50%) var(--sheen-y, 0%), var(--glass-sheen), transparent 68%)",
          }}
        />
      ) : null}
      {children}
    </div>
  );
}
