"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="glass sticky top-0 z-30 mx-3 flex h-14 shrink-0 items-center gap-3 rounded-2xl px-3 lg:top-3 lg:mx-0 lg:px-4">
      <MobileNav />
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
