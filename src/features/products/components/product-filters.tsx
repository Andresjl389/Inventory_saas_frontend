"use client";

import { X } from "lucide-react";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/features/categories/hooks/use-categories";

import type { ProductFilters } from "../types/product.types";

const ALL = "all";

/** Todo el filtrado viaja al backend como query params; nada se filtra aqui. */
export function ProductFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: ProductFilters;
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
}) {
  const categories = useCategories();

  const hasFilters =
    Boolean(filters.search) || Boolean(filters.category_id) || filters.is_active !== undefined;

  return (
    <>
      <SearchInput
        defaultValue={filters.search ?? ""}
        onChange={(search) => onChange({ search })}
        placeholder="Buscar por nombre o SKU..."
        label="Buscar productos"
        className="w-full sm:max-w-xs"
      />

      <Select
        value={filters.category_id ?? ALL}
        onValueChange={(value) => onChange({ category_id: value === ALL ? null : value })}
      >
        <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por categoria">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las categorias</SelectItem>
          {categories.data?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.is_active === undefined ? ALL : String(filters.is_active)}
        onValueChange={(value) =>
          onChange({ is_active: value === ALL ? undefined : value === "true" })
        }
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="true">Activos</SelectItem>
          <SelectItem value="false">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X aria-hidden />
          Limpiar
        </Button>
      ) : null}
    </>
  );
}
