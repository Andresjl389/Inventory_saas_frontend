"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AddMemberInput,
  ChangeMemberRoleInput,
} from "@/features/companies/schemas/company.schema";

import { platformApi } from "../api/platform.api";
import { platformKeys } from "../api/platform.keys";
import type {
  AssignSubscriptionInput,
  PlanInput,
  ProvisionCompanyInput,
  UpdateCompanyInput,
  UpdatePlanInput,
  UpdateUserInput,
  UserInput,
} from "../schemas/platform.schema";
import type {
  AdminCompanyFilters,
  AdminUserFilters,
  AuditFilters,
} from "../types/platform.types";

export function usePlatformStats() {
  return useQuery({
    queryKey: platformKeys.stats(),
    queryFn: () => platformApi.stats(),
    staleTime: 60_000,
  });
}

export function useAdminCompanies(filters: AdminCompanyFilters) {
  return useQuery({
    queryKey: platformKeys.companies(filters),
    queryFn: ({ signal }) => platformApi.listCompanies(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCompanySupervision(filters: AdminCompanyFilters) {
  return useQuery({
    queryKey: platformKeys.supervision(filters),
    queryFn: ({ signal }) => platformApi.supervision(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCompanyOverview(companyId: string | null) {
  return useQuery({
    queryKey: platformKeys.overview(companyId ?? ""),
    queryFn: () => platformApi.overview(companyId as string),
    enabled: Boolean(companyId),
  });
}

/**
 * Carga inicial de una empresa desde un libro de Excel.
 *
 * Con `dryRun` no escribe nada: es lo que hay que ensenar antes de confirmar,
 * porque la carga real va en un unico savepoint y es todo o nada.
 */
export function useCompanyOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({
      companyId,
      file,
      dryRun,
    }: {
      companyId: string;
      file: File;
      dryRun: boolean;
    }) => platformApi.onboarding(companyId, file, dryRun),
    onSuccess: async (result) => {
      if (result.dry_run) return;
      await queryClient.invalidateQueries({ queryKey: platformKeys.all });
      toast.success(
        `Carga inicial completada: ${result.totals.created} creados, ${result.totals.updated} actualizados`,
      );
    },
  });
}

export function useAdminCompany(companyId: string | null) {
  return useQuery({
    queryKey: platformKeys.company(companyId ?? ""),
    queryFn: () => platformApi.getCompany(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useAdminCompanyMembers(companyId: string | null) {
  return useQuery({
    queryKey: platformKeys.companyMembers(companyId ?? ""),
    queryFn: () => platformApi.companyMembers(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useCompanySubscription(companyId: string | null) {
  return useQuery({
    queryKey: platformKeys.subscription(companyId ?? ""),
    queryFn: () => platformApi.getSubscription(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery({
    queryKey: platformKeys.users(filters),
    queryFn: ({ signal }) => platformApi.listUsers(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePlans(isActive?: boolean) {
  return useQuery({
    queryKey: [...platformKeys.plans(), isActive ?? "todos"],
    queryFn: () => platformApi.listPlans(isActive),
    staleTime: 5 * 60_000,
  });
}

export function usePlatformAudit(filters: AuditFilters) {
  return useQuery({
    queryKey: platformKeys.audit(filters),
    queryFn: ({ signal }) => platformApi.audit(filters, signal),
    placeholderData: keepPreviousData,
  });
}

/** Toda escritura de plataforma cambia los contadores del resumen. */
function useInvalidatePlatform() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: platformKeys.all });
}

export function useProvisionCompany() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: ProvisionCompanyInput) => platformApi.provisionCompany(input),
    onSuccess: async (result) => {
      await invalidate();
      toast.success(
        result.owner_created
          ? `${result.company.name} creada, con cuenta nueva para ${result.owner.email}`
          : `${result.company.name} creada, con ${result.owner.email} como propietario`,
      );
    },
  });
}

export function useUpdateAdminCompany() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ companyId, input }: { companyId: string; input: UpdateCompanyInput }) =>
      platformApi.updateCompany(companyId, input),
    onSuccess: async (company) => {
      await invalidate();
      const messages = {
        ACTIVE: `${company.name} esta activa`,
        SUSPENDED: `${company.name} quedo suspendida`,
        INACTIVE: `${company.name} quedo inactiva`,
      } as const;
      toast.success(messages[company.status]);
    },
  });
}

export function useAddAdminCompanyMember(companyId: string) {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: AddMemberInput) => platformApi.addCompanyMember(companyId, input),
    onSuccess: async (member) => {
      await invalidate();
      toast.success(`${member.full_name} ya tiene acceso a la empresa`);
    },
  });
}

export function useChangeAdminCompanyMemberRole(companyId: string) {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ userId, input }: { userId: string; input: ChangeMemberRoleInput }) =>
      platformApi.changeCompanyMemberRole(companyId, userId, input),
    onSuccess: async (member) => {
      await invalidate();
      toast.success(`${member.full_name} actualizado`);
    },
  });
}

export function useAssignSubscription() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({
      companyId,
      input,
    }: {
      companyId: string;
      input: AssignSubscriptionInput;
    }) => platformApi.assignSubscription(companyId, input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Suscripcion actualizada");
    },
  });
}

export function useCreateAdminUser() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: UserInput) => platformApi.createUser(input),
    onSuccess: async (user) => {
      await invalidate();
      toast.success(`Cuenta creada para ${user.email}`);
    },
  });
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      platformApi.updateUser(userId, input),
    onSuccess: async (user) => {
      await invalidate();
      toast.success(`${user.email} actualizado`);
    },
  });
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: PlanInput) => platformApi.createPlan(input),
    onSuccess: async (plan) => {
      await invalidate();
      toast.success(`Plan ${plan.name} creado`);
    },
  });
}

export function useUpdatePlan() {
  const invalidate = useInvalidatePlatform();

  return useMutation({
    meta: { silent: true },
    mutationFn: ({ planId, input }: { planId: string; input: UpdatePlanInput }) =>
      platformApi.updatePlan(planId, input),
    onSuccess: async (plan) => {
      await invalidate();
      toast.success(`Plan ${plan.name} actualizado`);
    },
  });
}
