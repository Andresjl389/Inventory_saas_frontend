"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En produccion esto deberia ir a un servicio de errores.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Algo se rompio</h1>
        <p className="text-sm text-muted-foreground">
          No pudimos cargar esta pagina. Si vuelve a pasar, revisa que la API este disponible.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">ID: {error.digest}</p>
        ) : null}
        <Button onClick={reset}>
          <RotateCw aria-hidden />
          Reintentar
        </Button>
      </div>
    </main>
  );
}
