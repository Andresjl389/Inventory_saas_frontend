import type { DocumentType } from "@/config/documents";
import type { CompanyStatus } from "@/features/companies/types/company.types";
import type { Money } from "@/lib/format";

import type { AuditAction } from "@/features/audit/types/audit.types";

/** `PlatformStatsDTO` */
export type PlatformStats = {
  companies_total: number;
  companies_active: number;
  companies_suspended: number;
  users_total: number;
  users_active: number;
  platform_admins: number;
};

/** `AdminCompanyDTO` */
export type AdminCompany = {
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

/** `AdminUserDTO`. A diferencia de `UserDTO`, este si dice si es superusuario. */
export type AdminUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  last_login_at: string | null;
  created_at: string;
};

/** `PlanDTO`. Un limite en 0 significa "sin limite". */
export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: Money;
  max_users: number;
  max_products: number;
  max_warehouses: number;
  is_active: boolean;
};

export const SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIALING: "En prueba",
  ACTIVE: "Activa",
  PAST_DUE: "Vencida",
  CANCELLED: "Cancelada",
};

/** `SubscriptionDTO` */
export type Subscription = {
  id: string;
  company_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
};

/** `CompanyMetricsDTO`: los numeros reales de una empresa. */
export type CompanyMetrics = {
  members: number;
  active_members: number;
  products: number;
  active_products: number;
  warehouses: number;
  customers: number;
  suppliers: number;
  sales_count: number;
  sales_revenue: Money;
  purchases_count: number;
  stock_units: Money;
  stock_value: Money;
  last_sale_at: string | null;
};

/** `CompanyRowDTO`: una fila de la tabla de supervision. */
export type CompanyRow = {
  company: AdminCompany;
  plan_code: string | null;
  subscription_status: SubscriptionStatus | null;
  metrics: CompanyMetrics | null;
};

/** `PlanUsageDTO`. Un `limit` en 0 significa sin limite. */
export type PlanUsage = {
  resource: string;
  used: number;
  limit: number;
  over_limit: boolean;
};

export const USAGE_LABELS: Record<string, string> = {
  users: "Usuarios",
  products: "Productos",
  warehouses: "Bodegas",
};

/** `CompanyOverviewDTO` */
export type CompanyOverview = {
  company: AdminCompany;
  subscription: Subscription | null;
  plan: Plan | null;
  metrics: CompanyMetrics;
  usage: PlanUsage[];
  days_since_last_sale: number | null;
};

export const ONBOARDING_SHEET_STATUSES = [
  "LOADED",
  "LOADED_WITH_ERRORS",
  "SKIPPED",
  "EMPTY",
  "MISSING_COLUMNS",
] as const;

export type OnboardingSheetStatus = (typeof ONBOARDING_SHEET_STATUSES)[number];

export const ONBOARDING_SHEET_LABELS: Record<OnboardingSheetStatus, string> = {
  LOADED: "Cargada",
  LOADED_WITH_ERRORS: "Cargada con errores",
  SKIPPED: "Omitida",
  EMPTY: "Vacia",
  MISSING_COLUMNS: "Faltan columnas",
};

export type OnboardingSheet = {
  entity: string;
  sheet: string;
  status: OnboardingSheetStatus;
  stats: {
    total_rows: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  mapping: Record<string, string>;
  unmapped_columns: string[];
  missing_required: string[];
  errors: { row_number: number; column: string | null; message: string }[];
};

/**
 * Resultado de la carga inicial. Las hojas se procesan en orden de dependencia
 * dentro de un solo savepoint: o queda montada la empresa, o no se toco nada.
 */
export type OnboardingResult = {
  dry_run: boolean;
  totals: {
    total_rows: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  sheets: OnboardingSheet[];
};

/** `ProvisionedCompanyDTO` */
export type ProvisionedCompany = {
  company: AdminCompany;
  owner: AdminUser;
  owner_created: boolean;
  subscription: Subscription | null;
};

export type AdminCompanyFilters = {
  page: number;
  size: number;
  search?: string;
  status?: CompanyStatus | null;
  /**
   * Las metricas obligan al backend a entrar empresa por empresa, asi que con
   * muchas filas cuesta. Se puede apagar para buscar rapido.
   */
  with_metrics: boolean;
};

export const DEFAULT_COMPANY_FILTERS: AdminCompanyFilters = {
  page: 1,
  size: 20,
  search: "",
  status: null,
  with_metrics: true,
};

export type AdminUserFilters = {
  page: number;
  size: number;
  search?: string;
  is_active?: boolean;
  is_superuser?: boolean;
};

export const DEFAULT_USER_FILTERS: AdminUserFilters = {
  page: 1,
  size: 20,
  search: "",
  is_active: undefined,
  is_superuser: undefined,
};

export type AuditFilters = {
  page: number;
  size: number;
  action?: AuditAction | null;
  company_id?: string | null;
  actor_user_id?: string | null;
};

export const DEFAULT_AUDIT_FILTERS: AuditFilters = {
  page: 1,
  size: 20,
  action: null,
  company_id: null,
  actor_user_id: null,
};
