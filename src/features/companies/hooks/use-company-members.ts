"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useCompanyId } from "@/stores/tenant.store";

import { companiesApi } from "../api/companies.api";
import { companyKeys } from "../api/companies.keys";
import type { AddMemberInput } from "../schemas/company.schema";

export function useCompanyMembers(options: { enabled?: boolean } = {}) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: companyKeys.members(companyId),
    queryFn: () => companiesApi.listMembers(),
    enabled: options.enabled ?? true,
  });
}

export function useAddMember() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silent: true },
    mutationFn: (input: AddMemberInput) => companiesApi.addMember(input),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.members(companyId) });
      toast.success(`${member.full_name} ya tiene acceso a la empresa`);
    },
  });
}
