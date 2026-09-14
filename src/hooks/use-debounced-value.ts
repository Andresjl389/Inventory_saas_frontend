"use client";

import { useEffect, useState } from "react";

/**
 * Retrasa la propagacion de un valor. Se usa en las busquedas para no lanzar
 * una peticion por cada tecla (seccion 37: debounced search).
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
