import { roleLabel } from "@/config/permissions";

/** `RoleDTO`. `company_id` es null en los roles del sistema, que son comunes. */
export type Role = {
  id: string;
  company_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

/** `PermissionDTO`: el catalogo del que puede tirar un rol propio. */
export type Permission = {
  id: string;
  code: string;
  module: string;
  description: string;
};

/** Nombres de los modulos del catalogo, para agrupar la lista de permisos. */
export const MODULE_LABELS: Record<string, string> = {
  system: "Sistema",
  company: "Empresa",
  catalog: "Catalogo",
  inventory: "Inventario",
  partners: "Clientes y proveedores",
  sales: "Ventas",
  credit: "Fiado",
  purchases: "Compras",
  reports: "Informes",
  files: "Archivos",
  imports: "Importacion",
  audit: "Auditoria",
  notifications: "Notificaciones",
};

/**
 * Modulos del catalogo que no se ofrecen al armar un rol.
 *
 * El escaneo de facturas esta construido en el backend pero apagado
 * (`features.invoice_scanning: false` en `/health`): por ahora no se usa IA.
 * Marcar "Escanear facturas" en un rol daria un permiso para algo que no
 * existe. El dia que se encienda, basta con sacarlo de aqui.
 */
export const HIDDEN_PERMISSION_MODULES: ReadonlySet<string> = new Set(["invoices"]);

/**
 * Nombre a mostrar de un rol.
 *
 * Los del sistema vienen del backend en ingles ("Inventory manager"), asi que
 * se traducen aqui; los que crea una empresa se muestran tal como los
 * escribio quien los definio.
 */
export function displayRoleName(role: {
  code: string;
  name: string;
  is_system: boolean;
}): string {
  return role.is_system ? roleLabel(role.code) : role.name;
}

export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}
