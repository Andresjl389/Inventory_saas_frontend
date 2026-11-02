import { describe, expect, it } from "vitest";

import { salePaymentPreview } from "./sale-payment";

describe("salePaymentPreview", () => {
  it("de contado y sin monto paga todo, y deja que el backend lo resuelva", () => {
    const preview = salePaymentPreview({
      total: 10000,
      method: "CASH",
      paidInput: "",
      hasCustomer: false,
    });

    expect(preview.amountPaid).toBe(10000);
    expect(preview.outstanding).toBe(0);
    expect(preview.amountPaidField).toBeUndefined();
    expect(preview.problems).toEqual([]);
  });

  it("fiado y sin monto no paga nada", () => {
    const preview = salePaymentPreview({
      total: 10000,
      method: "CREDIT",
      paidInput: "",
      hasCustomer: true,
    });

    expect(preview.amountPaid).toBe(0);
    expect(preview.outstanding).toBe(10000);
    expect(preview.problems).toEqual([]);
  });

  it("un pago parcial deja el resto a deber", () => {
    const preview = salePaymentPreview({
      total: 10000,
      method: "CASH",
      paidInput: "4000,5",
      hasCustomer: true,
    });

    expect(preview.amountPaid).toBe(4000.5);
    expect(preview.outstanding).toBe(5999.5);
    expect(preview.amountPaidField).toBe("4000.5000");
  });

  it("fiar sin cliente se avisa antes de enviar", () => {
    const preview = salePaymentPreview({
      total: 10000,
      method: "CREDIT",
      paidInput: "",
      hasCustomer: false,
    });

    expect(preview.problems).toContain(
      "Para dejar saldo pendiente elige un cliente: no se le fia a nadie.",
    );
  });

  it("pagar de mas no existe", () => {
    const preview = salePaymentPreview({
      total: 10000,
      method: "TRANSFER",
      paidInput: "12000",
      hasCustomer: false,
    });

    expect(preview.problems).toContain("Lo pagado supera el total de la venta.");
    expect(preview.outstanding).toBe(0);
  });

  it("un monto ilegible no se envia", () => {
    const preview = salePaymentPreview({
      total: 10000,
      method: "CASH",
      paidInput: "abc",
      hasCustomer: false,
    });

    expect(preview.amountPaidField).toBeUndefined();
    expect(preview.problems).toContain("El monto pagado no es un numero valido.");
  });
});
