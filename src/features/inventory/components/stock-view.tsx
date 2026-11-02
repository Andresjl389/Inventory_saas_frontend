"use client";

import { ArrowLeftRight, Boxes, Scale, X } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { RowActions } from "@/components/shared/row-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProductCombobox } from "@/features/products/components/product-combobox";
import { useProductDirectory } from "@/features/products/hooks/use-product-directory";
import type { Product } from "@/features/products/types/product.types";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { useWarehouses } from "@/features/warehouses/hooks/use-warehouses";
import { formatQuantity, formatRelative, toNumber } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";
import { cn } from "cn";

import { useStock } from "../hooks/use-stock";
import {
  DEFAULT_STOCK_FILTERS,
  type ProductStock,
  type StockFilters,
} from "../types/inventory.types";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { TransferStockDialog } from "./transfer-stock-dialog";

const column = createDataTableColumns<ProductStock>();

export function StockView() {
  const canAdjust = usePermission("inventory.adjust");
  const canTransfer = usePermission("inventory.transfer");

  const [filters, setFilters] = useState<StockFilters>(DEFAULT_STOCK_FILTERS);
  const [filterProduct, setFilterProduct] = useState<Product | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [target, setTarget] = useState<{ product: Product | null; warehouseId: string | null }>({
    product: null,
    warehouseId: null,
  });

  const stock = useStock(filters);
  const products = useProductDirectory();
  const warehouses = useWarehouses();

  const warehouseNames = useMemo(
    () => new Map((warehouses.data ?? []).map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses.data],
  );

  const updateFilters = (patch: Partial<StockFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetFilters = () => {
    setFilters(DEFAULT_STOCK_FILTERS);
    setFilterProduct(null);
  };

  const openAdjust = (product: Product | null, warehouseId: string | null) => {
    setTarget({ product, warehouseId });
    setAdjustOpen(true);
  };

  const openTransfer = (product: Product | null, warehouseId: string | null) => {
    setTarget({ product, warehouseId });
    setTransferOpen(true);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("product_id", {
          header: () => <span>Producto</span>,
          enableSorting: false,
          cell: ({ getValue }) => {
            const product = products.lookup(getValue());
            if (!product) {
              // El diccionario solo carga una pagina; ver useProductDirectory.
              return (
                <span className="font-mono text-xs text-muted-foreground">
                  {getValue().slice(0, 8)}
                </span>
              );
            }
            return (
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{product.sku}</p>
              </div>
            );
          },
        }),
        column.accessor((row) => warehouseNames.get(row.warehouse_id) ?? "", {
          id: "warehouse",
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Bodega" />,
          cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">-</span>,
        }),
        column.accessor((row) => toNumber(row.quantity), {
          id: "quantity",
          header: ({ column: col }) => (
            <DataTableColumnHeader column={col} title="Existencias" align="right" />
          ),
          meta: { align: "right", width: "9rem" },
          cell: ({ getValue }) => {
            const value = getValue();
            return (
              <span
                className={cn(
                  "tnum block text-right font-medium",
                  value <= 0 && "text-muted-foreground",
                )}
              >
                {formatQuantity(value)}
              </span>
            );
          },
        }),
        column.accessor("updated_at", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Actualizado" />,
          meta: { width: "11rem" },
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{formatRelative(getValue())}</span>
          ),
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) => {
            const product = products.lookup(row.original.product_id) ?? null;
            return (
              <RowActions
                label="la fila"
                actions={[
                  {
                    label: "Ajustar",
                    icon: Scale,
                    hidden: !canAdjust,
                    onSelect: () => openAdjust(product, row.original.warehouse_id),
                  },
                  {
                    label: "Trasladar",
                    icon: ArrowLeftRight,
                    hidden: !canTransfer,
                    onSelect: () => openTransfer(product, row.original.warehouse_id),
                  },
                ]}
              />
            );
          },
        }),
      ]),
    [products, warehouseNames, canAdjust, canTransfer],
  );

  const page = stock.data;
  const hasFilters =
    Boolean(filters.product_id) ||
    Boolean(filters.warehouse_id) ||
    filters.only_non_zero !== DEFAULT_STOCK_FILTERS.only_non_zero;

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Inventario"
          description="Existencias por producto y bodega. Cada cambio deja su rastro en movimientos."
          actions={
            <div className="flex items-center gap-2">
              {canTransfer ? (
                <Button variant="outline" onClick={() => openTransfer(null, null)}>
                  <ArrowLeftRight aria-hidden />
                  Trasladar
                </Button>
              ) : null}
              {canAdjust ? (
                <Button onClick={() => openAdjust(null, null)}>
                  <Scale aria-hidden />
                  Ajustar
                </Button>
              ) : null}
            </div>
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <div className="w-full sm:max-w-xs">
            <ProductCombobox
              value={filterProduct}
              placeholder="Todos los productos"
              onSelect={(product) => {
                setFilterProduct(product);
                updateFilters({ product_id: product.id });
              }}
            />
          </div>

          <WarehouseSelect
            className="w-full sm:w-52"
            includeAll
            ariaLabel="Filtrar por bodega"
            value={filters.warehouse_id ?? null}
            onChange={(warehouseId) => updateFilters({ warehouse_id: warehouseId })}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="only-non-zero"
              checked={filters.only_non_zero}
              onCheckedChange={(checked) => updateFilters({ only_non_zero: checked === true })}
            />
            <Label htmlFor="only-non-zero" className="text-sm font-normal text-muted-foreground">
              Ocultar existencias en cero
            </Label>
          </div>

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X aria-hidden />
              Limpiar
            </Button>
          ) : null}
        </DataTableToolbar>
      </Reveal>

      {products.truncated ? (
        <Reveal delay={0.1}>
          <p className="text-xs text-muted-foreground">
            Hay mas de 100 productos: las filas cuyo producto no entre en esa primera pagina se
            muestran con su identificador hasta que la API devuelva el nombre en la respuesta de
            existencias.
          </p>
        </Reveal>
      ) : null}

      <Reveal delay={0.14}>
        <DataTable
          columns={columns}
          data={page?.items}
          isLoading={stock.isPending}
          isFetching={stock.isFetching && !stock.isPending}
          error={stock.error}
          onRetry={() => stock.refetch()}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={Boxes}
              title={hasFilters ? "Sin existencias que coincidan" : "Todavia no hay existencias"}
              description={
                hasFilters
                  ? "Prueba con otros filtros, o muestra tambien las existencias en cero."
                  : "Registra una compra o un ajuste para empezar a mover stock."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpiar filtros
                  </Button>
                ) : canAdjust ? (
                  <Button size="sm" onClick={() => openAdjust(null, null)}>
                    <Scale aria-hidden />
                    Ajustar existencias
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
                label="registros"
                onPageChange={(next) => updateFilters({ page: next })}
                onSizeChange={(size) => updateFilters({ size })}
              />
            ) : null
          }
        />
      </Reveal>

      <AdjustStockDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        product={target.product}
        warehouseId={target.warehouseId}
        onProductChange={(product) => setTarget((current) => ({ ...current, product }))}
      />

      <TransferStockDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        product={target.product}
        sourceWarehouseId={target.warehouseId}
        onProductChange={(product) => setTarget((current) => ({ ...current, product }))}
      />
    </>
  );
}
