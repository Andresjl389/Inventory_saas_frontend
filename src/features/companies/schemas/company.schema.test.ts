import { describe, expect, it } from "vitest";

import { addMemberSchema } from "./company.schema";

/**
 * El alta de miembro tiene dos formas: con una cuenta que ya existe (solo
 * correo y rol) y creandola en el mismo paso, que es a lo que obliga
 * `ACCOUNT_DETAILS_REQUIRED`.
 */
describe("addMemberSchema", () => {
  it("acepta correo y rol cuando la cuenta ya existe", () => {
    const result = addMemberSchema.parse({ email: "ada@example.com", role: "SELLER" });

    expect(result.withAccount).toBe(false);
    expect(result.role).toBe("SELLER");
  });

  it("exige nombre, apellido y contrasena al crear la cuenta", () => {
    const result = addMemberSchema.safeParse({
      email: "nuevo@example.com",
      role: "SELLER",
      withAccount: true,
    });

    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path.join("."));
    expect(fields).toEqual(expect.arrayContaining(["password", "first_name", "last_name"]));
  });

  it("rechaza una contrasena mas corta que el minimo del backend", () => {
    const result = addMemberSchema.safeParse({
      email: "nuevo@example.com",
      role: "SELLER",
      withAccount: true,
      password: "corta",
      first_name: "Nuevo",
      last_name: "Miembro",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["password"]);
  });

  it("no pide los datos de cuenta si no se van a crear", () => {
    const result = addMemberSchema.safeParse({
      email: "ada@example.com",
      role: "CAJERO",
      withAccount: false,
      password: "",
    });

    expect(result.success).toBe(true);
  });
});
