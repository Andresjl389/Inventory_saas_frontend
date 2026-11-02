import { beforeEach, describe, expect, it } from "vitest";

import type { Product } from "@/features/products/types/product.types";

import { cartTotals, itemGross, itemTotal, useSaleCart, type CartItem } from "./cart.store";

function product(id: string, salePrice = "10.0000"): Product {
  return {
    id,
    company_id: "c1",
    category_id: null,
    name: `Producto ${id}`,
    description: null,
    sku: `SKU-${id}`,
    barcode: null,
    cost_price: "5.0000",
    sale_price: salePrice,
    min_stock: "0.0000",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function line(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product: product("p1"),
    quantity: "2",
    unitPrice: "10",
    discount: "0",
    tax: "0",
    ...overrides,
  };
}

describe("totales de linea", () => {
  it("el bruto es cantidad por precio", () => {
    expect(itemGross(line())).toBe(20);
  });

  it("el total resta el descuento y suma el impuesto, como el backend", () => {
    expect(itemTotal(line({ discount: "5", tax: "3" }))).toBe(18);
  });

  it("un descuento mayor que el bruto da negativo, que es lo que el formulario bloquea", () => {
    expect(itemTotal(line({ discount: "30" }))).toBeLessThan(0);
  });
});

describe("cartTotals", () => {
  it("suma cada concepto por separado", () => {
    const totals = cartTotals([
      line({ quantity: "2", unitPrice: "10", discount: "5", tax: "1" }),
      line({ product: product("p2"), quantity: "1", unitPrice: "30", tax: "2" }),
    ]);

    expect(totals.subtotal).toBe(50);
    expect(totals.discount).toBe(5);
    expect(totals.tax).toBe(3);
    expect(totals.total).toBe(48);
  });

  it("un carrito vacio da cero en todo", () => {
    expect(cartTotals([])).toEqual({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  });
});

describe("carrito", () => {
  beforeEach(() => useSaleCart.getState().clear());

  it("agregar dos veces el mismo producto suma una unidad en vez de duplicar la linea", () => {
    const { addItem } = useSaleCart.getState();
    addItem(product("p1"), "10");
    addItem(product("p1"), "10");

    const { items } = useSaleCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe("2");
  });

  it("productos distintos crean lineas distintas", () => {
    const { addItem } = useSaleCart.getState();
    addItem(product("p1"), "10");
    addItem(product("p2"), "20");
    expect(useSaleCart.getState().items).toHaveLength(2);
  });

  it("vaciar deja el carrito en su estado inicial", () => {
    const state = useSaleCart.getState();
    state.addItem(product("p1"), "10");
    state.setNotes("algo");
    state.setWarehouse("w1");
    useSaleCart.getState().clear();

    const cleared = useSaleCart.getState();
    expect(cleared.items).toEqual([]);
    expect(cleared.notes).toBe("");
    expect(cleared.warehouseId).toBeNull();
    expect(cleared.partner).toBeNull();
  });
});
