import type { DocumentType } from "@/config/documents";
import type { Money } from "@/lib/format";

/**
 * Clientes y proveedores tienen exactamente la misma forma; el backend los
 * modela juntos en `models/partner.py`. Aqui se comparte el tipo y los
 * componentes, pero cada feature conserva su propia API, sus query keys y sus
 * permisos, que es donde de verdad se diferencian.
 */
export type Partner = {
  id: string;
  company_id: string;
  name: string;
  document_type: DocumentType | null;
  document_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  /** Solo clientes: tope de fiado, 0 = sin tope. */
  credit_limit?: Money;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnerFilters = {
  page: number;
  size: number;
  search?: string;
  /** `undefined` = todos, no "ninguno". */
  is_active?: boolean;
};

export const DEFAULT_PARTNER_FILTERS: PartnerFilters = {
  page: 1,
  size: 20,
  search: "",
  is_active: undefined,
};

/** Textos que cambian entre clientes y proveedores. */
export type PartnerCopy = {
  singular: string;
  plural: string;
  /** "Nuevo cliente" / "Nuevo proveedor" */
  newLabel: string;
  searchPlaceholder: string;
  /** Solo clientes: el formulario pide el cupo de fiado. */
  withCreditLimit?: boolean;
};
