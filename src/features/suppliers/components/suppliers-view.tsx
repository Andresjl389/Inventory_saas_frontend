"use client";

import { Factory } from "lucide-react";
import { useState } from "react";

import { PartnersView } from "@/features/partners/components/partners-view";
import {
  DEFAULT_PARTNER_FILTERS,
  type PartnerFilters,
} from "@/features/partners/types/partner.types";
import { handleFormError } from "@/lib/forms";
import { usePermission } from "@/providers/session-provider";

import { useSuppliers } from "../hooks/use-suppliers";
import {
  useCreateSupplier,
  useToggleSupplierActive,
  useUpdateSupplier,
} from "../hooks/use-supplier-mutations";

const COPY = {
  singular: "proveedor",
  plural: "proveedores",
  newLabel: "Nuevo proveedor",
  searchPlaceholder: "Buscar por nombre o documento...",
};

/**
 * Esta vista solo orquesta: estado de filtros, hooks de datos y mutaciones.
 * Toda la presentacion vive en `PartnersView`, compartida con clientes.
 */
export function SuppliersView() {
  const canWrite = usePermission("suppliers.write");
  const [filters, setFilters] = useState<PartnerFilters>(DEFAULT_PARTNER_FILTERS);

  const list = useSuppliers(filters);
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const toggle = useToggleSupplierActive();

  /** Cualquier cambio de filtro vuelve a la primera pagina. */
  const updateFilters = (patch: Partial<PartnerFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  return (
    <PartnersView
      copy={COPY}
      icon={Factory}
      description="A quien le compras. Se pueden desactivar sin perder su historico."
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
