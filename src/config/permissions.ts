/**
 * Autorizacion en la interfaz.
 *
 * El backend esta migrando los roles de un enum fijo a filas en `roles`, con
 * sus permisos en `role_permissions`, y cada empresa puede definir los suyos
 * encima de los del sistema. Un mapa fijo aqui no puede conocer esos roles
 * propios, asi que esta capa prefiere SIEMPRE el conjunto de permisos que
 * mande el servidor y solo cae en el mapa local cuando todavia no lo envia.
 *
 * Todo esto sirve unicamente para ocultar acciones. Quien autoriza de verdad
 * es `require_permission(...)` en FastAPI y, por debajo, RLS en PostgreSQL:
 * un boton oculto no es seguridad.
 */

/** Permiso comodin: dentro de su empresa puede todo. Solo OWNER lo tiene. */
export const WILDCARD = "*";

/** Roles que toda empresa recibe de serie (`SystemRole` en el backend). */
export const SYSTEM_ROLES = ["OWNER", "ADMIN", "INVENTORY_MANAGER", "SELLER"] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

/**
 * El codigo de rol es una cadena libre, no un enum: una empresa puede llamar
 * al suyo "CAJERO". Los del sistema son solo los que siempre existen.
 */
export type RoleCode = string;

const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  INVENTORY_MANAGER: "Jefe de inventario",
  SELLER: "Vendedor",
};

export const ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  OWNER: "Control total de la empresa, incluida la facturacion y los miembros.",
  ADMIN: "Gestiona catalogo, inventario, ventas, compras y miembros.",
  INVENTORY_MANAGER: "Crea y ajusta productos, inventario y compras.",
  SELLER: "Vende, fia, recibe abonos y gestiona clientes; el resto lo ve en modo lectura.",
};

function isSystemRole(code: RoleCode): code is SystemRole {
  return (SYSTEM_ROLES as readonly string[]).includes(code);
}

/** Nombre legible de un rol. Un rol propio se muestra con su propio codigo. */
export function roleLabel(code: RoleCode | null | undefined): string {
  if (!code) return "-";
  return isSystemRole(code) ? SYSTEM_ROLE_LABELS[code] : code;
}

export function roleDescription(code: RoleCode | null | undefined): string | undefined {
  if (!code || !isSystemRole(code)) return undefined;
  return ROLE_DESCRIPTIONS[code];
}

/**
 * Copia de los permisos de los roles del sistema, tomada de `GET /roles`.
 *
 * Es un plan B mientras la API no incluya el conjunto de permisos en la
 * sesion. En cuanto lo haga, esto deja de usarse; y con un rol propio nunca
 * acierta, por eso ante un codigo desconocido no concede nada.
 *
 * Si en el backend cambia lo que puede un rol, esta copia se queda atras: es
 * un respaldo, no la verdad.
 */
const FALLBACK_ROLE_PERMISSIONS: Record<SystemRole, ReadonlySet<string>> = {
  OWNER: new Set([WILDCARD]),
  ADMIN: new Set([
    "audit.read",
    "categories.read",
    "categories.write",
    "company.read",
    "company.update",
    "credit.manage",
    "credit.read",
    "customers.read",
    "customers.write",
    "files.read",
    "files.write",
    "inventory.adjust",
    "inventory.read",
    "inventory.transfer",
    "members.manage",
    "members.read",
    "products.create",
    "products.delete",
    "products.read",
    "products.update",
    "purchases.cancel",
    "purchases.create",
    "purchases.read",
    "reports.read",
    "roles.manage",
    "roles.read",
    "sales.cancel",
    "sales.create",
    "sales.read",
    "suppliers.read",
    "suppliers.write",
    "warehouses.read",
    "warehouses.write",
  ]),
  INVENTORY_MANAGER: new Set([
    "categories.read",
    "categories.write",
    "company.read",
    "credit.read",
    "customers.read",
    "files.read",
    "files.write",
    "inventory.adjust",
    "inventory.read",
    "inventory.transfer",
    "products.create",
    "products.read",
    "products.update",
    "purchases.cancel",
    "purchases.create",
    "purchases.read",
    "reports.read",
    "sales.read",
    "suppliers.read",
    "suppliers.write",
    "warehouses.read",
    "warehouses.write",
  ]),
  SELLER: new Set([
    "categories.read",
    "company.read",
    "credit.manage",
    "credit.read",
    "customers.read",
    "customers.write",
    "files.read",
    "inventory.read",
    "products.read",
    "sales.create",
    "sales.read",
    "warehouses.read",
  ]),
};

export type PermissionSource = {
  /** Lo que mande el servidor. Si viene, manda esto y nada mas. */
  permissions?: readonly string[] | null;
  roleCode?: RoleCode | null;
};

export function can(permission: string, source: PermissionSource): boolean {
  const { permissions, roleCode } = source;

  if (permissions && permissions.length > 0) {
    return permissions.includes(WILDCARD) || permissions.includes(permission);
  }

  if (!roleCode || !isSystemRole(roleCode)) return false;

  const fallback = FALLBACK_ROLE_PERMISSIONS[roleCode];
  return fallback.has(WILDCARD) || fallback.has(permission);
}

/** Permisos efectivos de un rol del sistema. Solo para el plan B y los tests. */
export function systemRolePermissions(role: SystemRole): ReadonlySet<string> {
  return FALLBACK_ROLE_PERMISSIONS[role];
}
