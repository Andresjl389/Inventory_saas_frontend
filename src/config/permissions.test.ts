import { describe, expect, it } from "vitest";

import { can } from "./permissions";

/**
 * Este mapa refleja `ROLE_PERMISSIONS` del backend
 * (app/domain/tenants/tenant_context.py). Si alli cambia, aqui debe fallar.
 */
describe("can", () => {
  it("OWNER tiene el comodin", () => {
    expect(can("OWNER", "products.delete")).toBe(true);
    expect(can("OWNER", "cualquier.cosa")).toBe(true);
  });

  it("ADMIN gestiona miembros, INVENTORY_MANAGER no", () => {
    expect(can("ADMIN", "members.manage")).toBe(true);
    expect(can("INVENTORY_MANAGER", "members.manage")).toBe(false);
  });

  it("INVENTORY_MANAGER crea productos pero no los borra", () => {
    expect(can("INVENTORY_MANAGER", "products.create")).toBe(true);
    expect(can("INVENTORY_MANAGER", "products.delete")).toBe(false);
  });

  it("SELLER es solo lectura", () => {
    expect(can("SELLER", "products.read")).toBe(true);
    expect(can("SELLER", "products.create")).toBe(false);
    expect(can("SELLER", "categories.write")).toBe(false);
  });

  it("sin rol no hay permiso", () => {
    expect(can(null, "products.read")).toBe(false);
    expect(can(undefined, "products.read")).toBe(false);
  });
});
