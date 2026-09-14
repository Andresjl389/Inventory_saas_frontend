"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ComponentType, ReactNode } from "react";

import { fadeItem, riseItem, staggerContainer } from "./transitions";

/**
 * Cada etiqueta de `motion` tiene su propio tipo de ref (div, li, tr...), asi
 * que no se unifican en un solo generico sin pelear con TypeScript. El mapa se
 * construye una vez a nivel de modulo: elegir la etiqueta es una busqueda, no
 * la creacion de un componente nuevo en cada render.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMotion = ComponentType<HTMLMotionProps<any>>;

const TAGS = {
  div: motion.div as AnyMotion,
  section: motion.section as AnyMotion,
  header: motion.header as AnyMotion,
  ul: motion.ul as AnyMotion,
  li: motion.li as AnyMotion,
  tr: motion.tr as AnyMotion,
  tbody: motion.tbody as AnyMotion,
} as const;

type MotionTag = keyof typeof TAGS;

type MotionBoxProps = {
  children?: ReactNode;
  className?: string;
  as?: MotionTag;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

/** Entrada individual: sube, se enfoca y aparece. */
export function Reveal({ children, className, as = "div", delay = 0, ...props }: MotionBoxProps) {
  const Component = TAGS[as];

  return (
    <Component
      initial="hidden"
      animate="visible"
      variants={riseItem}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Contenedor que escalona a sus hijos. Cada hijo debe ser un `<StaggerItem>` o
 * cualquier `motion` que use las variantes `hidden` / `visible`.
 */
export function Stagger({ children, className, as = "div", ...props }: MotionBoxProps) {
  const Component = TAGS[as];

  return (
    <Component
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
  variant = "rise",
  ...props
}: MotionBoxProps & { variant?: "rise" | "fade" }) {
  const Component = TAGS[as];

  return (
    <Component
      variants={variant === "rise" ? riseItem : fadeItem}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
