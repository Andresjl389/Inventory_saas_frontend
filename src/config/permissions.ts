/**
 * Espejo de `ROLE_PERMISSIONS` (app/domain/tenants/tenant_context.py).
 *
 * Sirve solo para ocultar acciones en la UI. La autorizacion real la hace el
 * backend en `require_permission(...)` y, por debajo, RLS en PostgreSQL.
 * Boton oculto != seguridad.
 */
export const COMPANY_ROLES = [
  "OWNER",
  "ADMIN",
  "INVENTORY_MANAGER",
  "SELLER",
] as const;

export type CompanyRole = (typeof COMPANY_ROLES)[number];

export const ROLE_LABELS: Record<CompanyRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  INVENTORY_MANAGER: "Jefe de inventario",
  SELLER: "Vendedor",
};

export const ROLE_DESCRIPTIONS: Record<CompanyRole, string> = {
  OWNER: "Control total de la empresa, incluida la facturacion y los miembros.",
  ADMIN: "Gestiona catalogo, inventario y miembros.",
  INVENTORY_MANAGER: "Crea y ajusta productos e inventario, sin gestionar miembros.",
  SELLER: "Solo lectura del catalogo y del inventario.",
};

const ROLE_PERMISSIONS: Record<CompanyRole, ReadonlySet<string>> = {
  OWNER: new Set(["*"]),
  ADMIN: new Set([
    "company.read",
    "company.update",
    "members.read",
    "members.manage",
    "categories.read",
    "categories.write",
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "warehouses.read",
    "warehouses.write",
    "inventory.read",
    "inventory.adjust",
    "inventory.transfer",
  ]),
  INVENTORY_MANAGER: new Set([
    "company.read",
    "categories.read",
    "categories.write",
    "products.read",
    "products.create",
    "products.update",
    "warehouses.read",
    "inventory.read",
    "inventory.adjust",
    "inventory.transfer",
  ]),
  SELLER: new Set([
    "company.read",
    "categories.read",
    "products.read",
    "warehouses.read",
    "inventory.read",
  ]),
};

export function can(role: CompanyRole | null | undefined, permission: string): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.has("*") || permissions.has(permission);
}
