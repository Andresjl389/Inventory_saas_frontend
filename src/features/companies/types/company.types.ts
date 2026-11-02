import type { DocumentType } from "@/config/documents";
import type { RoleCode } from "@/config/permissions";

export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
  INACTIVE: "Inactiva",
};

/** `CompanyDTO` */
export type Company = {
  id: string;
  name: string;
  legal_name: string | null;
  document_type: DocumentType | null;
  document_number: string | null;
  email: string | null;
  phone: string | null;
  status: CompanyStatus;
  created_at: string;
};

/**
 * `MembershipDTO`: lo que alimenta el selector de empresa.
 *
 * El backend esta pasando los roles de un enum a filas en `roles`, asi que el
 * codigo puede llegar como `role` (contrato actual) o como `role_code` (el que
 * viene). Se aceptan ambos y `membershipRole` se queda con el que exista, para
 * que el cambio de contrato no obligue a tocar ninguna pantalla.
 */
export type Membership = {
  company_id: string;
  company_name: string;
  role?: RoleCode;
  role_code?: RoleCode;
  /** Permisos efectivos. Cuando lleguen, mandan sobre cualquier mapa local. */
  permissions?: string[];
  is_active: boolean;
};

export function membershipRole(membership: Membership): RoleCode {
  return membership.role_code ?? membership.role ?? "";
}

/** `CompanyMemberDTO` */
export type CompanyMember = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role?: RoleCode;
  role_code?: RoleCode;
  /** Fila de `roles` que aplica. Desambigua un codigo propio que pise uno del sistema. */
  role_id?: string;
  is_active: boolean;
};

export function memberRole(member: CompanyMember): RoleCode {
  return member.role_code ?? member.role ?? "";
}
