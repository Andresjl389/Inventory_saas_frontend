"use client";

import { Building2, LogOut, PauseCircle } from "lucide-react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal } from "@/components/shared/motion/reveal";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-logout";

import { useMemberships } from "../hooks/use-memberships";
import { useSwitchCompany } from "../hooks/use-switch-company";

/**
 * Empresa suspendida o inactiva.
 *
 * El operador de la plataforma puede suspender una empresa, y a partir de la
 * siguiente peticion todas fallan con `INVALID_COMPANY`. Es un estado de la
 * aplicacion, no un error suelto: se explica y se ofrece salida, en vez de
 * dejar la pantalla rota.
 */
export function CompanyBlocked() {
  const memberships = useMemberships();
  const switchCompany = useSwitchCompany();
  const logout = useLogout();

  const others = (memberships.data ?? []).filter((membership) => membership.is_active);

  return (
    <Reveal className="w-full max-w-md space-y-6">
      <GlassPanel sheen={false} className="p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-warning/30 bg-warning/10 text-warning">
          <PauseCircle className="size-6" aria-hidden />
        </span>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">Empresa suspendida</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta empresa esta suspendida o inactiva, asi que sus miembros no pueden operar. Quien
          administra la plataforma puede reactivarla.
        </p>

        {others.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tus otras empresas
            </p>
            {others.map((membership) => (
              <Button
                key={membership.company_id}
                variant="outline"
                className="w-full justify-start"
                disabled={switchCompany.isPending}
                onClick={() => switchCompany.mutate(membership.company_id)}
              >
                <Building2 aria-hidden />
                {membership.company_name}
              </Button>
            ))}
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut aria-hidden />
          Cerrar sesion
        </Button>
      </GlassPanel>
    </Reveal>
  );
}
