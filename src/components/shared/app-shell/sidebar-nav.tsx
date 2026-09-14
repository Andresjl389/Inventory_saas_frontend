"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { springSoft } from "@/components/shared/motion/transitions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navigation, secondaryNavigation, type NavItem } from "@/config/navigation";
import { usePermission } from "@/providers/session-provider";
import { cn } from "cn";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  collapsed,
  groupId,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  groupId: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {!collapsed && item.disabled ? (
        <span className="ml-auto rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-muted-foreground">
          Pronto
        </span>
      ) : null}
    </>
  );

  const base = cn(
    "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm",
    "transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    collapsed && "justify-center px-0",
  );

  if (item.disabled) {
    return (
      <span
        aria-disabled
        title="Disponible cuando el backend exponga este modulo"
        className={cn(base, "cursor-not-allowed text-sidebar-muted-foreground/70")}
      >
        {content}
      </span>
    );
  }

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
      )}
    >
      {/*
        Un unico indicador compartido que se desliza entre secciones en vez de
        aparecer y desaparecer. `layoutId` lleva el id del grupo porque el menu
        de escritorio y el movil existen a la vez en el arbol.
      */}
      {active ? (
        <motion.span
          layoutId={`${groupId}-nav-active`}
          transition={springSoft}
          aria-hidden
          className="glass-sidebar absolute inset-0 -z-10 rounded-xl"
        />
      ) : null}
      {content}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({
  collapsed = false,
  groupId = "desktop",
  onNavigate,
}: {
  collapsed?: boolean;
  groupId?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Principal">
      {navigation.map((section) => (
        <SidebarSection
          key={section.title}
          title={section.title}
          items={section.items}
          collapsed={collapsed}
          groupId={groupId}
          onNavigate={onNavigate}
        />
      ))}

      <div className="mt-auto">
        <SidebarSection
          title="Cuenta"
          items={secondaryNavigation}
          collapsed={collapsed}
          groupId={groupId}
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );
}

function SidebarSection({
  title,
  items,
  collapsed,
  groupId,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  groupId: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {!collapsed ? (
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted-foreground">
          {title}
        </p>
      ) : null}
      {items.map((item) => (
        <PermissionGate key={item.href} permission={item.permission}>
          <NavLink
            item={item}
            collapsed={collapsed}
            groupId={groupId}
            onNavigate={onNavigate}
          />
        </PermissionGate>
      ))}
    </div>
  );
}

/** Oculta secciones que el rol no puede abrir. El backend valida igualmente. */
function PermissionGate({
  permission,
  children,
}: {
  permission?: string;
  children: ReactNode;
}) {
  const allowed = usePermission(permission ?? "");
  if (permission && !allowed) return null;
  return <>{children}</>;
}
