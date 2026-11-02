"use client";

import { ArrowLeft, Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/shared/app-shell/theme-toggle";
import { UserMenu } from "@/components/shared/app-shell/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { platformNavigation } from "@/config/platform-navigation";
import { cn } from "cn";

export function PlatformHeader({ hasCompanies }: { hasCompanies: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = platformNavigation.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
  );

  return (
    <header className="glass sticky top-0 z-30 mx-3 flex h-14 shrink-0 items-center gap-3 rounded-2xl px-3 lg:top-3 lg:mx-0 lg:px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menu">
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          data-scope="platform"
          className="glass-nav flex w-72 flex-col gap-0 p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Menu de plataforma</SheetTitle>
          <div className="flex h-14 items-center gap-2.5 px-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="size-4.5" aria-hidden />
            </span>
            <span className="text-sm font-semibold tracking-tight">Plataforma</span>
          </div>
          <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Plataforma">
            {platformNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "glass-sidebar font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
          {hasCompanies ? (
            <div className="mt-auto border-t border-white/8 p-3">
              <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                <Link href="/dashboard">
                  <ArrowLeft aria-hidden />
                  Volver a mi empresa
                </Link>
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        <Badge
          variant="outline"
          className="shrink-0 gap-1 border-primary/40 font-normal text-primary"
        >
          <ShieldCheck className="size-3" aria-hidden />
          Plataforma
        </Badge>
        {current ? (
          <span className="truncate text-sm font-medium">{current.label}</span>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu settingsHref={hasCompanies ? "/settings" : null} />
      </div>
    </header>
  );
}
