"use client";

import { useState } from "react";

import { PartnerCombobox } from "@/features/partners/components/partner-combobox";
import type { Partner } from "@/features/partners/types/partner.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { useSuppliers } from "../hooks/use-suppliers";

/** Selector de proveedor: solo activos, porque en uno inactivo el backend rechaza la operacion. */
export function SupplierCombobox({
  value,
  onSelect,
  onClear,
  id,
}: {
  value: Partner | null;
  onSelect: (partner: Partner) => void;
  onClear?: () => void;
  id?: string;
}) {
  const [term, setTerm] = useState("");
  const search = useDebouncedValue(term, 350);
  const list = useSuppliers({ page: 1, size: 20, search, is_active: true });

  return (
    <PartnerCombobox
      id={id}
      value={value}
      items={list.data?.items ?? []}
      loading={list.isFetching}
      term={term}
      onTermChange={setTerm}
      onSelect={onSelect}
      onClear={onClear}
      placeholder="Sin proveedor"
      emptyLabel="Ningun proveedor coincide"
    />
  );
}
