"use client";

import { Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { formatMoney, formatPercent, margin } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { useProducts } from "../hooks/use-products";
import { DEFAULT_PRODUCT_FILTERS, type Product, type ProductFilters } from "../types/product.types";
import { ProductFiltersBar } from "./product-filters";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductRowActions } from "./product-row-actions";

const column = createDataTableColumns<Product>();

export function ProductsView() {
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  // Cambiarlo remonta la barra de filtros y vacia el buscador sin efectos.
  const [filtersKey, setFiltersKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const canCreate = usePermission("products.create");
  const products = useProducts(filters);
  const categories = useCategories();

  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    [categories.data],
  );

  /** Cualquier cambio de filtro vuelve a la primera pagina. */
  const updateFilters = (patch: Partial<ProductFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetFilters = () => {
    setFilters(DEFAULT_PRODUCT_FILTERS);
    setFiltersKey((key) => key + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("name", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Producto" />,
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          ),
        }),
        column.accessor((row) => categoryNames.get(row.category_id ?? "") ?? "", {
          id: "category",
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Categoria" />,
          cell: ({ getValue }) => {
            const name = getValue();
            return name ? (
              <Badge variant="outline" className="font-normal">
                {name}
              </Badge>
            ) : (
              <span className="text-muted-foreground">Sin categoria</span>
            );
          },
        }),
        column.accessor("cost_price", {
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Costo" align="right" />
          ),
          meta: { align: "right", width: "8rem" },
          cell: ({ getValue }) => (
            <span className="tnum block text-right">{formatMoney(getValue())}</span>
          ),
        }),
        column.accessor("sale_price", {
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Venta" align="right" />
          ),
          meta: { align: "right", width: "8rem" },
          cell: ({ getValue }) => (
            <span className="tnum block text-right font-medium">{formatMoney(getValue())}</span>
          ),
        }),
        column.accessor((row) => margin(row.cost_price, row.sale_price) ?? -1, {
          id: "margin",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Margen" align="right" />
          ),
          meta: { align: "right", width: "7rem" },
          cell: ({ row }) => {
            const value = margin(row.original.cost_price, row.original.sale_price);
            if (value === null) {
              return <span className="block text-right text-muted-foreground">-</span>;
            }
            return (
              <span
                className={`tnum block text-right ${value < 0 ? "text-destructive" : ""}`}
              >
                {formatPercent(value)}
              </span>
            );
          },
        }),
        column.accessor("is_active", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Estado" />,
          meta: { width: "7rem" },
          cell: ({ getValue }) =>
            getValue() ? (
              <Badge variant="outline" className="border-success/40 font-normal text-success">
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal text-muted-foreground">
                Inactivo
              </Badge>
            ),
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) => (
            <div className="flex justify-end">
              <ProductRowActions product={row.original} onEdit={openEdit} />
            </div>
          ),
        }),
      ]),
    [categoryNames],
  );

  const page = products.data;
  const hasActiveFilters =
    Boolean(filters.search) || Boolean(filters.category_id) || filters.is_active !== undefined;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Productos"
          description="Catalogo de la empresa activa. La busqueda y los filtros se resuelven en el servidor."
          actions={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden />
                Nuevo producto
              </Button>
            ) : null
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <ProductFiltersBar
            key={filtersKey}
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
          />
        </DataTableToolbar>
      </Reveal>

      <Reveal delay={0.14}>
        <DataTable
        columns={columns}
        data={page?.items}
        isLoading={products.isPending}
        isFetching={products.isFetching && !products.isPending}
        error={products.error}
        onRetry={() => products.refetch()}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Package}
            title={hasActiveFilters ? "Ningun producto coincide" : "Todavia no hay productos"}
            description={
              hasActiveFilters
                ? "Prueba con otros filtros o limpia la busqueda."
                : "Crea el primer producto para empezar a construir tu catalogo."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Limpiar filtros
                </Button>
              ) : canCreate ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus aria-hidden />
                  Nuevo producto
                </Button>
              ) : null
            }
          />
        }
        footer={
          page && page.total > 0 ? (
            <DataTablePagination
              page={page.page}
              size={page.size}
              total={page.total}
              pages={page.pages}
              label="productos"
              onPageChange={(next) => setFilters((current) => ({ ...current, page: next }))}
              onSizeChange={(size) => updateFilters({ size })}
            />
          ) : null
        }
      />

      </Reveal>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
    </>
  );
}
