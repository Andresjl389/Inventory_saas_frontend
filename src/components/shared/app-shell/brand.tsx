import { Boxes } from "lucide-react";

import { appConfig } from "@/config/env";
import { cn } from "cn";

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_1px_0_0_rgb(255_255_255/0.3)_inset,0_6px_18px_-6px_var(--color-sidebar-primary)]">
        <Boxes className="size-4.5" aria-hidden />
      </span>
      {!collapsed ? (
        <span className="truncate text-sm font-semibold tracking-tight">{appConfig.name}</span>
      ) : null}
    </div>
  );
}
