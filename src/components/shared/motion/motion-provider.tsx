"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` hace que Motion respete la preferencia del sistema
 * sin que cada animacion tenga que comprobarlo por su cuenta.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </MotionConfig>
  );
}
