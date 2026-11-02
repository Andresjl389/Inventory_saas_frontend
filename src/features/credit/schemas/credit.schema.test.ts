import { describe, expect, it } from "vitest";

import {
  adjustAccountFormSchema,
  paymentSchema,
  toAdjustAccountCommand,
} from "./credit.schema";

describe("abono", () => {
  it("acepta un abono menor o igual a la deuda", () => {
    const result = paymentSchema(5000).parse({ amount: "5000", method: "CASH" });

    expect(result.amount).toBe("5000.0000");
    expect(result.notes).toBeNull();
  });

  it("rechaza un abono mayor que la deuda antes de molestar al backend", () => {
    const result = paymentSchema(5000).safeParse({ amount: "50000", method: "CASH" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Es mas de lo que debe");
  });

  it("rechaza un abono de cero", () => {
    expect(paymentSchema(5000).safeParse({ amount: "0", method: "CASH" }).success).toBe(false);
  });

  it("no admite fiar un abono", () => {
    expect(paymentSchema(5000).safeParse({ amount: "1", method: "CREDIT" }).success).toBe(
      false,
    );
  });
});

describe("ajuste de cuenta", () => {
  it("bajar la deuda se envia en negativo", () => {
    const values = adjustAccountFormSchema.parse({
      direction: "decrease",
      amount: "2000",
      notes: "Perdon de saldo",
    });

    expect(toAdjustAccountCommand(values)).toEqual({
      amount: "-2000.0000",
      notes: "Perdon de saldo",
    });
  });

  it("subir la deuda se envia en positivo", () => {
    const values = adjustAccountFormSchema.parse({
      direction: "increase",
      amount: "1500",
      notes: "Venta del cuaderno viejo",
    });

    expect(toAdjustAccountCommand(values).amount).toBe("1500.0000");
  });

  it("exige una nota que explique el ajuste", () => {
    const result = adjustAccountFormSchema.safeParse({
      direction: "decrease",
      amount: "1000",
      notes: "  ",
    });

    expect(result.success).toBe(false);
  });
});
