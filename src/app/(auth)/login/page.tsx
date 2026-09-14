import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Iniciar sesion" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Inicia sesion</h1>
        <p className="text-sm text-muted-foreground">
          Entra con tu cuenta para acceder a tus empresas.
        </p>
      </header>

      {/* `useSearchParams` obliga a un limite de Suspense. */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
