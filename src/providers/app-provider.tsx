"use client";

import type { ReactNode } from "react";

import { MotionProvider } from "@/components/shared/motion/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/** Unico punto de montaje de los providers globales. */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={200}>
          <MotionProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </MotionProvider>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
