"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { errorMessage, isApiError } from "@/lib/api/errors";

export function ErrorState({
  error,
  onRetry,
  title = "No pudimos cargar esta informacion",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive backdrop-blur-sm">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground max-w-sm">{errorMessage(error)}</p>
        {isApiError(error) && error.requestId ? (
          /* Con este identificador se encuentra la peticion en los logs. */
          <p className="font-mono text-[11px] text-muted-foreground/80">
            ID: {error.requestId}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
