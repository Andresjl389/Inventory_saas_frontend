import { describe, expect, it } from "vitest";

import { WILDCARD, can, roleLabel, systemRolePermissions } from "./permissions";

describe("can: permisos que manda el servidor", () => {
  it("manda la lista del servidor por encima de cualquier mapa local", () => {
    // Un rol propio de la empresa: el mapa local no sabe nada de el.
    const source = { roleCode: "CAJERO", permissions: ["sales.create", "sales.read"] };

    expect(can("sales.create", source)).toBe(true);
    expect(can("products.delete", source)).toBe(false);
  });

  it("el comodin concede cualquier permiso", () => {
    expect(can("lo.que.sea", { roleCode: "OWNER", permissions: [WILDCARD] })).toBe(true);
  });
});

describe("can: plan B mientras la API no envie permisos", () => {
  it("OWNER puede todo", () => {
    expect(can("products.delete", { roleCode: "OWNER" })).toBe(true);
    expect(can("cualquier.cosa", { roleCode: "OWNER" })).toBe(true);
  });

  it("ADMIN gestiona miembros, INVENTORY_MANAGER no", () => {
    expect(can("members.manage", { roleCode: "ADMIN" })).toBe(true);
    expect(can("members.manage", { roleCode: "INVENTORY_MANAGER" })).toBe(false);
  });

  it("INVENTORY_MANAGER crea productos pero no los borra", () => {
    expect(can("products.create", { roleCode: "INVENTORY_MANAGER" })).toBe(true);
    expect(can("products.delete", { roleCode: "INVENTORY_MANAGER" })).toBe(false);
  });

  it("SELLER vende y gestiona clientes, pero no toca el catalogo", () => {
    expect(can("sales.create", { roleCode: "SELLER" })).toBe(true);
    expect(can("customers.write", { roleCode: "SELLER" })).toBe(true);
    expect(can("products.create", { roleCode: "SELLER" })).toBe(false);
    expect(can("categories.write", { roleCode: "SELLER" })).toBe(false);
  });

  it("un rol propio sin permisos del servidor no concede nada", () => {
    // Preferible a adivinar: el backend lo rechazaria igualmente.
    expect(can("sales.create", { roleCode: "CAJERO" })).toBe(false);
  });

  it("sin rol no hay permiso", () => {
    expect(can("products.read", { roleCode: null })).toBe(false);
    expect(can("products.read", {})).toBe(false);
  });

  it("una lista vacia no se confunde con 'sin permisos': cae en el plan B", () => {
    expect(can("products.read", { roleCode: "SELLER", permissions: [] })).toBe(true);
  });
});

describe("roleLabel", () => {
  it("traduce los roles del sistema", () => {
    expect(roleLabel("INVENTORY_MANAGER")).toBe("Jefe de inventario");
  });

  it("un rol propio se muestra con su codigo en vez de en blanco", () => {
    expect(roleLabel("CAJERO")).toBe("CAJERO");
  });

  it("sin rol devuelve un guion", () => {
    expect(roleLabel(null)).toBe("-");
  });
});

describe("systemRolePermissions", () => {
  it("OWNER solo necesita el comodin", () => {
    expect([...systemRolePermissions("OWNER")]).toEqual([WILDCARD]);
  });
});
