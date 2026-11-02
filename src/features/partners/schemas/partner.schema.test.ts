import { describe, expect, it } from "vitest";

import { NO_DOCUMENT_TYPE, partnerSchema } from "./partner.schema";

describe("partnerSchema", () => {
  it("normaliza los opcionales vacios a null, que es lo que acepta el backend", () => {
    const result = partnerSchema.parse({
      name: "Ferreteria Central",
      document_type: NO_DOCUMENT_TYPE,
      document_number: "  ",
      email: "",
      phone: "",
      address: "   ",
    });

    expect(result.document_type).toBeNull();
    expect(result.document_number).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
  });

  it("conserva un documento valido", () => {
    const result = partnerSchema.parse({
      name: "Acme",
      document_type: "NIT",
      document_number: "900123456",
    });

    expect(result.document_type).toBe("NIT");
    expect(result.document_number).toBe("900123456");
  });

  it("exige el nombre", () => {
    expect(partnerSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rechaza un correo con formato invalido", () => {
    expect(partnerSchema.safeParse({ name: "Acme", email: "no-es-correo" }).success).toBe(false);
  });

  it("el cupo de fiado viaja como decimal", () => {
    expect(partnerSchema.parse({ name: "Dona Rosa", credit_limit: "20000" }).credit_limit).toBe(
      "20000.0000",
    );
  });

  it("sin el campo (proveedores) el cupo no viaja", () => {
    expect(partnerSchema.parse({ name: "Acme" }).credit_limit).toBeUndefined();
  });

  it("rechaza un cupo negativo", () => {
    expect(partnerSchema.safeParse({ name: "Acme", credit_limit: "-1" }).success).toBe(false);
  });
});
