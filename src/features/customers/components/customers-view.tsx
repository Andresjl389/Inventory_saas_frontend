"use client";

import { HandCoins, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { PartnersView } from "@/features/partners/components/partners-view";
import {
  DEFAULT_PARTNER_FILTERS,
  type Partner,
  type PartnerFilters,
} from "@/features/partners/types/partner.types";
import { handleFormError } from "@/lib/forms";
import { usePermission } from "@/providers/session-provider";

import { useCustomers } from "../hooks/use-customers";
import {
  useCreateCustomer,
  useToggleCustomerActive,
  useUpdateCustomer,
} from "../hooks/use-customer-mutations";

const COPY = {
  singular: "cliente",
  plural: "clientes",
  newLabel: "Nuevo cliente",
  searchPlaceholder: "Buscar por nombre o documento...",
  withCreditLimit: true,
};

/**
 * Esta vista solo orquesta: estado de filtros, hooks de datos y mutaciones.
 * Toda la presentacion vive en `PartnersView`, compartida con proveedores.
 */
export function CustomersView() {
  const canWrite = usePermission("customers.write");
  const canReadCredit = usePermission("credit.read");
  const router = useRouter();
  const [filters, setFilters] = useState<PartnerFilters>(DEFAULT_PARTNER_FILTERS);

  const list = useCustomers(filters);
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const toggle = useToggleCustomerActive();

  const extraActions = useCallback(
    (partner: Partner) => [
      {
        label: "Ver fiado",
        icon: HandCoins,
        hidden: !canReadCredit,
        onSelect: () => router.push(`/credit/${partner.id}`),
      },
    ],
    [canReadCredit, router],
  );

  /** Cualquier cambio de filtro vuelve a la primera pagina. */
  const updateFilters = (patch: Partial<PartnerFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  return (
    <PartnersView
      copy={COPY}
      icon={Users}
      description="Personas y empresas a las que vendes. Se pueden desactivar sin perder su historico."
      canWrite={canWrite}
      list={list}
      filters={filters}
      onFiltersChange={updateFilters}
      onReset={() => setFilters(DEFAULT_PARTNER_FILTERS)}
      submitting={create.isPending || update.isPending}
      onSubmit={(partner, values, setError, done) => {
        const options = {
          onSuccess: () => done(),
          onError: (error: unknown) => handleFormError(error, setError),
        };
        if (partner) {
          update.mutate({ id: partner.id, input: values }, options);
        } else {
          create.mutate(values, options);
        }
      }}
      extraActions={extraActions}
      toggling={toggle.isPending}
      onToggleActive={(partner, done) =>
        toggle.mutate(
          { id: partner.id, isActive: partner.is_active },
          { onSettled: () => done() },
        )
      }
    />
  );
}
