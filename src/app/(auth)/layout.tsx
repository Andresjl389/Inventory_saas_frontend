import { Boxes } from "lucide-react";
import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shared/glass-panel";
import { Reveal } from "@/components/shared/motion/reveal";
import { appConfig } from "@/config/env";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10">
      {/*
        Dos focos de luz detras del panel. Es lo que el cristal desenfoca: sin
        ellos, la superficie translucida no tendria nada que revelar.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 size-[38rem] rounded-full bg-[radial-gradient(circle,var(--color-primary),transparent_65%)] opacity-25 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-32 size-[34rem] rounded-full bg-[radial-gradient(circle,var(--color-chart-2),transparent_65%)] opacity-25 blur-3xl"
      />

      <Reveal className="w-full max-w-5xl">
        <GlassPanel variant="thick" className="grid overflow-hidden rounded-[2rem] lg:grid-cols-[22rem_1fr]">
          <aside className="relative flex flex-col justify-between gap-10 bg-sidebar/90 p-8 text-sidebar-foreground lg:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(80%_100%_at_50%_0%,var(--color-sidebar-primary),transparent_70%)] opacity-30"
            />

            <div className="relative flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_1px_0_0_rgb(255_255_255/0.3)_inset,0_6px_18px_-6px_var(--color-sidebar-primary)]">
                <Boxes className="size-4.5" aria-hidden />
              </span>
              <span className="text-sm font-semibold tracking-tight">{appConfig.name}</span>
            </div>

            <div className="relative hidden space-y-3 lg:block">
              <p className="text-2xl font-semibold leading-snug tracking-tight text-balance">
                Un inventario por empresa, sin mezclar datos.
              </p>
              <p className="text-sm text-sidebar-muted-foreground">
                Cada usuario puede pertenecer a varias empresas. El acceso se valida en el servidor
                en cada peticion.
              </p>
            </div>

            <p className="relative hidden text-xs text-sidebar-muted-foreground lg:block">
              {appConfig.fullName}
            </p>
          </aside>

          <main className="flex items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-md">{children}</div>
          </main>
        </GlassPanel>
      </Reveal>
    </div>
  );
}
