import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="text-xl font-semibold tracking-tight">Esta pagina no existe</h1>
        <p className="text-sm text-muted-foreground">
          Puede que el enlace este mal o que la seccion todavia no este disponible.
        </p>
        <Button asChild>
          <Link href="/dashboard">Volver al panel</Link>
        </Button>
      </div>
    </main>
  );
}
