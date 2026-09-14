"use client";

import { Building2, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/config/permissions";
import { CreateCompanyDialog } from "@/features/companies/components/create-company-dialog";
import { useSwitchCompany } from "@/features/companies/hooks/use-switch-company";
import { useSession } from "@/providers/session-provider";
import { useTenant } from "@/stores/tenant.store";
import { cn } from "cn";

/**
 * Selector de empresa. Es el unico sitio desde el que cambia el tenant activo
 * (seccion 9). Al elegir una empresa se reescribe la cookie y la app recarga.
 */
export function CompanySelector({ collapsed = false }: { collapsed?: boolean }) {
  const { memberships } = useSession();
  const { companyId, companyName, role } = useTenant();
  const switchCompany = useSwitchCompany();
  const [createOpen, setCreateOpen] = useState(false);

  const pending = switchCompany.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={pending}
            aria-label={`Empresa activa: ${companyName}. Cambiar de empresa`}
            className={cn(
              "glass-sidebar flex w-full items-center gap-2.5 rounded-2xl p-2 text-left",
              "transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "hover:bg-white/12 active:scale-[0.985]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              "disabled:opacity-60",
              collapsed && "justify-center",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/25 text-xs font-semibold text-sidebar-primary-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2)]">
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                companyName.slice(0, 2).toUpperCase()
              )}
            </span>
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{companyName}</span>
                  <span className="block truncate text-xs text-sidebar-muted-foreground">
                    {ROLE_LABELS[role]}
                  </span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-sidebar-muted-foreground" aria-hidden />
              </>
            ) : null}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Tus empresas
          </DropdownMenuLabel>

          {memberships.map((membership) => {
            const isCurrent = membership.company_id === companyId;
            return (
              <DropdownMenuItem
                key={membership.company_id}
                disabled={pending || !membership.is_active}
                onSelect={() => {
                  if (isCurrent) return;
                  switchCompany.mutate(membership.company_id);
                }}
                className="gap-2"
              >
                <Building2 className="size-4 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{membership.company_name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {ROLE_LABELS[membership.role]}
                  </span>
                </span>
                {isCurrent ? <Check className="size-4 text-primary" aria-hidden /> : null}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" aria-hidden />
            Crear empresa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

/** Version compacta para la cabecera movil. */
export function CompanyBadge() {
  const { companyName } = useTenant();
  return (
    <Button variant="ghost" size="sm" className="max-w-40 justify-start gap-2" disabled>
      <Building2 className="size-4 text-muted-foreground" aria-hidden />
      <span className="truncate">{companyName}</span>
    </Button>
  );
}
