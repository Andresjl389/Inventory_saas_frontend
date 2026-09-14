import type { CompanyRole } from "@/config/permissions";

export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export const DOCUMENT_TYPES = ["NIT", "CC", "CE", "PASSPORT", "RUT", "OTHER"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  NIT: "NIT",
  CC: "Cedula de ciudadania",
  CE: "Cedula de extranjeria",
  PASSPORT: "Pasaporte",
  RUT: "RUT",
  OTHER: "Otro",
};

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

/** `MembershipDTO`: lo que alimenta el selector de empresa. */
export type Membership = {
  company_id: string;
  company_name: string;
  role: CompanyRole;
  is_active: boolean;
};

/** `CompanyMemberDTO` */
export type CompanyMember = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: CompanyRole;
  is_active: boolean;
};
