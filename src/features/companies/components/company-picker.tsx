"use client";

import { Building2, Loader2, LogOut, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/config/permissions";
import { useLogout } from "@/features/auth/hooks/use-logout";

import { useMemberships } from "../hooks/use-memberships";
import { useSwitchCompany } from "../hooks/use-switch-company";
import { CreateCompanyDialog } from "./create-company-dialog";

/**
 * Pantalla intermedia cuando el usuario pertenece a mas de una empresa.
 * Con una sola, el login ya la elige y esta pagina no llega a verse.
 */
export function CompanyPicker() {
  const memberships = useMemberships();
  const switchCompany = useSwitchCompany();
  const logout = useLogout();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const choose = (companyId: string) => {
    setSelected(companyId);
    switchCompany.mutate(companyId);
  };

  return (
    <Reveal className="w-full max-w-md space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Elige una empresa</h1>
        <p className="text-sm text-muted-foreground">
          Trabajaras dentro de la empresa que selecciones. Puedes cambiarla en cualquier momento.
        </p>
      </header>

      <GlassPanel sheen={false}>
        {memberships.isPending ? (
          <div className="space-y-3 p-4" aria-hidden>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="shimmer h-12 w-full rounded-xl bg-foreground/6" />
            ))}
          </div>
        ) : memberships.error ? (
          <ErrorState error={memberships.error} onRetry={() => memberships.refetch()} />
        ) : (memberships.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Building2}
            title="Todavia no perteneces a ninguna empresa"
            description="Crea una para empezar, o pide a un administrador que te agregue a la suya."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden />
                Crear empresa
              </Button>
            }
          />
        ) : (
          <Stagger as="ul" className="divide-y divide-white/40 dark:divide-white/6">
            {memberships.data?.map((membership) => {
              const pending = switchCompany.isPending && selected === membership.company_id;
              return (
                <StaggerItem as="li" key={membership.company_id} variant="fade">
                  <button
                    type="button"
                    disabled={!membership.is_active || switchCompany.isPending}
                    onClick={() => choose(membership.company_id)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-foreground/5 focus-visible:bg-foreground/6 focus-visible:outline-none active:scale-[0.99] disabled:opacity-60"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/55 text-xs font-semibold shadow-[inset_0_1px_0_0_rgb(255_255_255/0.7)] dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)]">
                      {membership.company_name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {membership.company_name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {ROLE_LABELS[membership.role]}
                        {membership.is_active ? "" : " - inactiva"}
                      </span>
                    </span>
                    {pending ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                    ) : null}
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </GlassPanel>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden />
          Crear empresa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut aria-hidden />
          Cerrar sesion
        </Button>
      </div>

      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Reveal>
  );
}
