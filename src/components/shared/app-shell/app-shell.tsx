"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";

import { springSoft } from "@/components/shared/motion/transitions";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "cn";

import { AppHeader } from "./app-header";
import { Brand } from "./brand";
import { CompanySelector } from "./company-selector";
import { SidebarNav } from "./sidebar-nav";

/**
 * La barra lateral y la cabecera flotan sobre el fondo en lugar de pegarse a
 * los bordes: es lo que deja ver la luz ambiental por detras y hace que el
 * cristal tenga algo que refractar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh gap-0 lg:gap-3 lg:p-3">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <motion.aside
        animate={{ width: collapsed ? "4.75rem" : "16rem" }}
        transition={springSoft}
        className={cn(
          "glass-nav sticky top-3 hidden h-[calc(100svh-1.5rem)] shrink-0 flex-col rounded-3xl text-sidebar-foreground lg:flex",
        )}
      >
        <div className={cn("flex h-14 items-center px-3", collapsed && "justify-center")}>
          <Brand collapsed={collapsed} />
        </div>

        <div className="px-3 pb-2">
          <CompanySelector collapsed={collapsed} />
        </div>

        <SidebarNav collapsed={collapsed} groupId="desktop" />

        <div
          className={cn(
            "border-t border-white/8 p-2",
            collapsed ? "flex justify-center" : "px-3",
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expandir menu" : "Plegar menu"}
            className="text-sidebar-muted-foreground hover:bg-white/10 hover:text-sidebar-accent-foreground"
          >
            {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
          </Button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <AppHeader />

        <main id="contenido" className="flex-1 px-4 pt-2 pb-10 lg:px-0 lg:pt-3">
          {/*
            La clave es la ruta: al navegar, el contenido anterior se va y el
            nuevo entra, en lugar de reemplazarse de golpe.
          */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-7xl space-y-5"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
