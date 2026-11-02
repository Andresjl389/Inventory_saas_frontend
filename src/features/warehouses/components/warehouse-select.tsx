"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useActiveWarehouses } from "../hooks/use-warehouses";

/** Valor centinela: Radix Select no admite "". */
export const ALL_WAREHOUSES = "all";

/**
 * Selector de bodega. Solo lista las activas: en una inactiva no se puede
 * registrar nada, y ofrecerla solo llevaria a un 422 del backend.
 */
export function WarehouseSelect({
  value,
  onChange,
  id,
  className,
  includeAll = false,
  allLabel = "Todas las bodegas",
  placeholder = "Selecciona una bodega",
  disabled = false,
  ariaLabel,
}: {
  value: string | null;
  onChange: (warehouseId: string | null) => void;
  id?: string;
  className?: string;
  includeAll?: boolean;
  allLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const warehouses = useActiveWarehouses();

  return (
    <Select
      value={value ?? (includeAll ? ALL_WAREHOUSES : "")}
      onValueChange={(next) => onChange(next === ALL_WAREHOUSES ? null : next)}
      disabled={disabled || warehouses.isPending}
    >
      <SelectTrigger id={id} className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={warehouses.isPending ? "Cargando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll ? <SelectItem value={ALL_WAREHOUSES}>{allLabel}</SelectItem> : null}
        {warehouses.data?.map((warehouse) => (
          <SelectItem key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
