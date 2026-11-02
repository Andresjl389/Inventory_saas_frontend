"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { errorMessage, isApiError } from "@/lib/api/errors";

/**
 * Errores que no puede resolver un reintento: hay que sacar al usuario del
 * estado en el que esta. Se hace con una navegacion completa para que el
 * middleware vuelva a evaluar las cookies y no quede cache del tenant anterior.
 */
function handleSessionError(error: unknown): boolean {
  if (typeof window === "undefined" || !isApiError(error)) return false;

  if (error.isUnauthorized) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa: el router de Next conservaria la cache de la sesion muerta
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    return true;
  }

  if (error.code === "INVALID_MEMBERSHIP" || error.code === "COMPANY_REQUIRED") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- idem: no debe sobrevivir nada del tenant anterior
    window.location.href = "/select-company";
    return true;
  }

  // Empresa suspendida: no es lo mismo que no pertenecer a ella, y merece su
  // propia pantalla en vez de un toast que no explica nada.
  if (error.code === "INVALID_COMPANY") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa: todo el estado del tenant deja de valer
    window.location.href = "/company-suspended";
    return true;
  }

  return false;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: handleSessionError,
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (handleSessionError(error)) return;
            // Los formularios que mapean errores por campo marcan `meta.silent`.
            if (mutation.meta?.silent) return;
            toast.error(errorMessage(error));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // 4xx no se arregla reintentando.
              if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
