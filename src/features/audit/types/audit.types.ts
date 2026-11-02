/**
 * La auditoria la consumen dos sitios con el mismo DTO: la empresa, por
 * `/reports/audit`, y la plataforma, por `/admin/audit`. Por eso los tipos
 * viven aqui y no dentro de ninguno de los dos.
 */
export const AUDIT_ACTIONS = [
  "COMPANY_CREATED",
  "COMPANY_UPDATED",
  "COMPANY_SUSPENDED",
  "COMPANY_ACTIVATED",
  "MEMBER_ADDED",
  "MEMBER_ROLE_CHANGED",
  "MEMBER_DEACTIVATED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "USER_CREATED",
  "USER_DEACTIVATED",
  "USER_PASSWORD_RESET",
  "SUBSCRIPTION_CHANGED",
  "STOCK_ADJUSTED",
  "STOCK_TRANSFERRED",
  "SALE_COMPLETED",
  "SALE_CANCELLED",
  "SALE_REFUNDED",
  "PURCHASE_COMPLETED",
  "PURCHASE_CANCELLED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  COMPANY_CREATED: "Empresa creada",
  COMPANY_UPDATED: "Empresa actualizada",
  COMPANY_SUSPENDED: "Empresa suspendida",
  COMPANY_ACTIVATED: "Empresa reactivada",
  MEMBER_ADDED: "Miembro agregado",
  MEMBER_ROLE_CHANGED: "Rol de miembro cambiado",
  MEMBER_DEACTIVATED: "Miembro desactivado",
  ROLE_CREATED: "Rol creado",
  ROLE_UPDATED: "Rol actualizado",
  ROLE_DELETED: "Rol eliminado",
  USER_CREATED: "Usuario creado",
  USER_DEACTIVATED: "Usuario desactivado",
  USER_PASSWORD_RESET: "Contrasena restablecida",
  SUBSCRIPTION_CHANGED: "Suscripcion cambiada",
  STOCK_ADJUSTED: "Stock ajustado",
  STOCK_TRANSFERRED: "Stock trasladado",
  SALE_COMPLETED: "Venta completada",
  SALE_CANCELLED: "Venta cancelada",
  SALE_REFUNDED: "Venta reembolsada",
  PURCHASE_COMPLETED: "Compra completada",
  PURCHASE_CANCELLED: "Compra cancelada",
};

/** `AuditEntryDTO` */
export type AuditEntry = {
  id: string;
  action: AuditAction;
  company_id: string | null;
  actor_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};
