import { describe, expect, it } from "vitest";

import {
  adjustStockFormSchema,
  toAdjustCommand,
  transferStockSchema,
} from "./inventory.schema";

const WAREHOUSE_A = "11111111-1111-4111-8111-111111111111";
const WAREHOUSE_B = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "33333333-3333-4333-8333-333333333333";

describe("ajuste de existencias", () => {
  it("una salida se envia con signo negativo", () => {
    const values = adjustStockFormSchema.parse({
      product_id: PRODUCT,
      warehouse_id: WAREHOUSE_A,
      direction: "out",
      quantity: "3",
      notes: "rotura",
    });

    expect(toAdjustCommand(values).quantity_delta).toBe("-3.0000");
  });

  it("una entrada se envia en positivo", () => {
    const values = adjustStockFormSchema.parse({
      product_id: PRODUCT,
      warehouse_id: WAREHOUSE_A,
      direction: "in",
      quantity: "3",
    });

    expect(toAdjustCommand(values).quantity_delta).toBe("3.0000");
  });

  it("rechaza un ajuste de cero, que no cambiaria nada", () => {
    const result = adjustStockFormSchema.safeParse({
      product_id: PRODUCT,
      warehouse_id: WAREHOUSE_A,
      direction: "in",
      quantity: "0",
    });
    expect(result.success).toBe(false);
  });

  it("un motivo vacio viaja como null, no como cadena vacia", () => {
    const values = adjustStockFormSchema.parse({
      product_id: PRODUCT,
      warehouse_id: WAREHOUSE_A,
      direction: "in",
      quantity: "1",
      notes: "   ",
    });
    expect(values.notes).toBeNull();
  });
});

describe("traslado entre bodegas", () => {
  it("acepta origen y destino distintos", () => {
    const result = transferStockSchema.safeParse({
      product_id: PRODUCT,
      source_warehouse_id: WAREHOUSE_A,
      destination_warehouse_id: WAREHOUSE_B,
      quantity: "5",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza trasladar a la misma bodega antes de molestar al backend", () => {
    const result = transferStockSchema.safeParse({
      product_id: PRODUCT,
      source_warehouse_id: WAREHOUSE_A,
      destination_warehouse_id: WAREHOUSE_A,
      quantity: "5",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["destination_warehouse_id"]);
    }
  });

  it("rechaza cantidades de cero o negativas", () => {
    for (const quantity of ["0", "-2"]) {
      const result = transferStockSchema.safeParse({
        product_id: PRODUCT,
        source_warehouse_id: WAREHOUSE_A,
        destination_warehouse_id: WAREHOUSE_B,
        quantity,
      });
      expect(result.success).toBe(false);
    }
  });
});
