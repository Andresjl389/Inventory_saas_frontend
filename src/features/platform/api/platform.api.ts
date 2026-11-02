import type {
  AddMemberInput,
  ChangeMemberRoleInput,
} from "@/features/companies/schemas/company.schema";
import type { CompanyMember } from "@/features/companies/types/company.types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type {
  AssignSubscriptionInput,
  PlanInput,
  ProvisionCompanyInput,
  UpdateCompanyInput,
  UpdatePlanInput,
  UpdateUserInput,
  UserInput,
} from "../schemas/platform.schema";
import type { AuditEntry } from "@/features/audit/types/audit.types";

import { appConfig } from "@/config/env";

import type {
  AdminCompany,
  AdminCompanyFilters,
  AdminUser,
  AdminUserFilters,
  AuditFilters,
  CompanyOverview,
  CompanyRow,
  OnboardingResult,
  Plan,
  PlatformStats,
  ProvisionedCompany,
  Subscription,
} from "../types/platform.types";

/**
 * API de plataforma.
 *
 * Ninguna de estas rutas pide `X-Company-ID`: son de quien opera el SaaS, no
 * de un inquilino. El proxy lo manda igualmente cuando hay cookie, y el
 * backend lo ignora aqui.
 */
export const platformApi = {
  stats: () => apiClient.get<PlatformStats>("/admin/stats"),

  listCompanies: (filters: AdminCompanyFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<AdminCompany>>("/admin/companies", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        status: filters.status ?? undefined,
      },
    }),

  /** La tabla principal: empresa, plan, suscripcion y numeros reales. */
  supervision: (filters: AdminCompanyFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<CompanyRow>>("/admin/companies/supervision", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        status: filters.status ?? undefined,
        with_metrics: filters.with_metrics,
      },
    }),

  overview: (companyId: string) =>
    apiClient.get<CompanyOverview>(`/admin/companies/${companyId}/overview`),

  /** Enlace a la plantilla de carga inicial; pasa por el proxy por las cookies. */
  onboardingTemplateUrl: () => `${appConfig.bffPrefix}/admin/onboarding/template`,

  onboarding: (companyId: string, file: File, dryRun: boolean) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.upload<OnboardingResult>(
      `/admin/companies/${companyId}/onboarding`,
      form,
      { params: { dry_run: dryRun } },
    );
  },

  getCompany: (companyId: string) =>
    apiClient.get<AdminCompany>(`/admin/companies/${companyId}`),

  provisionCompany: (input: ProvisionCompanyInput) =>
    apiClient.post<ProvisionedCompany>("/admin/companies", input),

  updateCompany: (companyId: string, input: UpdateCompanyInput) =>
    apiClient.patch<AdminCompany>(`/admin/companies/${companyId}`, input),

  companyMembers: (companyId: string) =>
    apiClient.get<CompanyMember[]>(`/admin/companies/${companyId}/members`),

  /**
   * Alta de miembro desde la plataforma. Es la via de reparacion cuando una
   * empresa se queda sin nadie que pueda administrarla: el super admin entra
   * por encima de los permisos del tenant.
   */
  addCompanyMember: (
    companyId: string,
    { withAccount, password, first_name, last_name, ...input }: AddMemberInput,
  ) =>
    apiClient.post<CompanyMember>(`/admin/companies/${companyId}/members`, {
      ...input,
      ...(withAccount ? { password, first_name, last_name } : {}),
    }),

  changeCompanyMemberRole: (companyId: string, userId: string, input: ChangeMemberRoleInput) =>
    apiClient.patch<CompanyMember>(
      `/admin/companies/${companyId}/members/${userId}`,
      input,
    ),

  getSubscription: (companyId: string) =>
    apiClient.get<Subscription | null>(`/admin/companies/${companyId}/subscription`),

  assignSubscription: (companyId: string, input: AssignSubscriptionInput) =>
    apiClient.put<Subscription>(`/admin/companies/${companyId}/subscription`, input),

  listUsers: (filters: AdminUserFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<AdminUser>>("/admin/users", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        search: filters.search?.trim() || undefined,
        is_active: filters.is_active,
        is_superuser: filters.is_superuser,
      },
    }),

  createUser: (input: UserInput) => apiClient.post<AdminUser>("/admin/users", input),

  updateUser: (userId: string, input: UpdateUserInput) =>
    apiClient.patch<AdminUser>(`/admin/users/${userId}`, input),

  listPlans: (isActive?: boolean) =>
    apiClient.get<Plan[]>("/admin/plans", { params: { is_active: isActive } }),

  createPlan: (input: PlanInput) => apiClient.post<Plan>("/admin/plans", input),

  updatePlan: (planId: string, input: UpdatePlanInput) =>
    apiClient.patch<Plan>(`/admin/plans/${planId}`, input),

  audit: (filters: AuditFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<AuditEntry>>("/admin/audit", {
      signal,
      params: {
        page: filters.page,
        size: filters.size,
        action: filters.action ?? undefined,
        company_id: filters.company_id ?? undefined,
        actor_user_id: filters.actor_user_id ?? undefined,
      },
    }),
};
