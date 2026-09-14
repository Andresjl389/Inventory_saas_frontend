import { describe, expect, it } from "vitest";

import { margin, toNumber } from "./format";

describe("toNumber", () => {
  it("lee los Decimal serializados como cadena", () => {
    expect(toNumber("10.5000")).toBe(10.5);
  });

  it("trata lo vacio o invalido como 0", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber("")).toBe(0);
    expect(toNumber("abc")).toBe(0);
  });
});

describe("margin", () => {
  it("calcula el margen sobre el precio de venta", () => {
    expect(margin("50", "100")).toBe(0.5);
  });

  it("puede ser negativo si se vende por debajo del costo", () => {
    expect(margin("100", "80")).toBeCloseTo(-0.25);
  });

  it("devuelve null si no hay precio de venta, en vez de un 0 enganoso", () => {
    expect(margin("10", "0")).toBeNull();
    expect(margin("10", null as unknown as string)).toBeNull();
  });
});
