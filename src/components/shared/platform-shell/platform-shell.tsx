"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { springSoft } from "@/components/shared/motion/transitions";
import { Button } from "@/components/ui/button";
import { platformNavigation } from "@/config/platform-navigation";
import { cn } from "cn";

import { PlatformHeader } from "./platform-header";

/**
 * Shell del area de plataforma.
 *
 * No lleva selector de empresa a proposito: quien opera la plataforma no esta
 * dentro de ningun inquilino. El acento ambar viene de `data-scope="platform"`
 * y es lo que impide confundir esta zona con el panel de una empresa.
 */
export function PlatformShell({
  children,
  hasCompanies,
}: {
  children: ReactNode;
  /** Solo se ofrece "volver al panel" si de verdad pertenece a alguna empresa. */
  hasCompanies: boolean;
}) {
  const pathname = usePathname();

  return (
    <div data-scope="platform" className="flex min-h-svh gap-0 lg:gap-3 lg:p-3">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <aside className="glass-nav sticky top-3 hidden h-[calc(100svh-1.5rem)] w-64 shrink-0 flex-col rounded-3xl text-sidebar-foreground lg:flex">
        <div className="flex h-14 items-center gap-2.5 px-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_1px_0_0_rgb(255_255_255/0.3)_inset,0_6px_18px_-6px_var(--color-sidebar-primary)]">
            <ShieldCheck className="size-4.5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">
              Plataforma
            </span>
            <span className="block truncate text-[11px] text-sidebar-muted-foreground">
              Administracion del SaaS
            </span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Plataforma">
          {platformNavigation.map((item) => {
            // `/admin` solo esta activo en su ruta exacta: si no, lo estaria siempre.
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm",
                  "transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active
                    ? "font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="platform-nav-active"
                    transition={springSoft}
                    aria-hidden
                    className="glass-sidebar absolute inset-0 -z-10 rounded-xl"
                  />
                ) : null}
                <item.icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {hasCompanies ? (
          <div className="border-t border-white/8 p-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full justify-start text-sidebar-muted-foreground hover:bg-white/10 hover:text-sidebar-accent-foreground"
            >
              <Link href="/dashboard">
                <ArrowLeft aria-hidden />
                Volver a mi empresa
              </Link>
            </Button>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <PlatformHeader hasCompanies={hasCompanies} />

        <main id="contenido" className="flex-1 px-4 pt-2 pb-10 lg:px-0 lg:pt-3">
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
