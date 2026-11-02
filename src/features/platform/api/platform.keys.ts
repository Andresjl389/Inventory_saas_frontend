import type {
  AdminCompanyFilters,
  AdminUserFilters,
  AuditFilters,
} from "../types/platform.types";

/**
 * Las claves de plataforma NO llevan companyId: estos datos son de la
 * instalacion entera, no de un tenant.
 */
export const platformKeys = {
  all: ["platform"] as const,
  stats: () => [...platformKeys.all, "stats"] as const,
  companies: (filters: AdminCompanyFilters) =>
    [...platformKeys.all, "companies", filters] as const,
  supervision: (filters: AdminCompanyFilters) =>
    [...platformKeys.all, "supervision", filters] as const,
  company: (companyId: string) => [...platformKeys.all, "company", companyId] as const,
  overview: (companyId: string) =>
    [...platformKeys.all, "company", companyId, "overview"] as const,
  companyMembers: (companyId: string) =>
    [...platformKeys.all, "company", companyId, "members"] as const,
  subscription: (companyId: string) =>
    [...platformKeys.all, "company", companyId, "subscription"] as const,
  users: (filters: AdminUserFilters) => [...platformKeys.all, "users", filters] as const,
  plans: () => [...platformKeys.all, "plans"] as const,
  audit: (filters: AuditFilters) => [...platformKeys.all, "audit", filters] as const,
};
