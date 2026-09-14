import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { cn } from "cn";

/** Panel de cristal con cabecera: el contenedor estandar de cada bloque. */
export function SectionPanel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <GlassPanel className={cn("flex h-full flex-col", className)}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/40 px-4 dark:border-white/8">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </GlassPanel>
  );
}
