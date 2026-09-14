"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui.store";

import { Brand } from "./brand";
import { CompanySelector } from "./company-selector";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="glass-nav flex w-72 flex-col gap-0 p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
        <div className="flex h-14 items-center px-3">
          <Brand />
        </div>
        <div className="px-3 pb-2">
          <CompanySelector />
        </div>
        <SidebarNav groupId="mobile" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
