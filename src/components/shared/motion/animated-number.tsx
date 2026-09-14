"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";

/**
 * Cifra que cuenta hasta su valor. Con `prefers-reduced-motion` aparece ya
 * calculada: el dato es lo importante, la animacion es un adorno.
 */
export function AnimatedNumber({
  value,
  format = (n: number) => String(n),
  duration = 0.9,
  className,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(reduceMotion ? value : 0);
  const text = useTransform(progress, (current) => format(Math.round(current)));

  useEffect(() => {
    if (reduceMotion) {
      progress.set(value);
      return;
    }
    const controls = animate(progress, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, duration, progress, reduceMotion]);

  return (
    <motion.span className={className} aria-label={format(value)}>
      {text}
    </motion.span>
  );
}
