import { describe, expect, it } from "vitest";

import { NO_CATEGORY, productSchema } from "./product.schema";

const base = {
  name: "Martillo",
  sku: "MAR-01",
  cost_price: "10",
  sale_price: "20",
  min_stock: "5",
};

describe("productSchema", () => {
  it("envia los precios como cadena con 4 decimales, como espera Decimal", () => {
    const result = productSchema.parse(base);
    expect(result.cost_price).toBe("10.0000");
    expect(result.sale_price).toBe("20.0000");
  });

  it("acepta coma decimal y separadores con espacio", () => {
    const result = productSchema.parse({ ...base, sale_price: "1 234,50" });
    expect(result.sale_price).toBe("1234.5000");
  });

  it("rechaza precios vacios, negativos o no numericos", () => {
    expect(productSchema.safeParse({ ...base, cost_price: "" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, cost_price: "-1" }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, cost_price: "abc" }).success).toBe(false);
  });

  it("convierte el centinela de 'sin categoria' en null", () => {
    expect(productSchema.parse({ ...base, category_id: NO_CATEGORY }).category_id).toBeNull();
    expect(productSchema.parse({ ...base, category_id: "" }).category_id).toBeNull();
  });

  it("normaliza los opcionales vacios a null, que es lo que acepta el backend", () => {
    const result = productSchema.parse({ ...base, description: "  ", barcode: "" });
    expect(result.description).toBeNull();
    expect(result.barcode).toBeNull();
  });

  it("envia el stock minimo con la misma escala que los precios", () => {
    // Es el umbral que usa el informe de bajo minimo, y el backend lo guarda
    // como Decimal igual que el dinero.
    expect(productSchema.parse(base).min_stock).toBe("5.0000");
  });

  it("rechaza un stock minimo negativo", () => {
    expect(productSchema.safeParse({ ...base, min_stock: "-1" }).success).toBe(false);
  });

  it("exige nombre y SKU", () => {
    expect(productSchema.safeParse({ ...base, name: "  " }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, sku: "" }).success).toBe(false);
  });
});
