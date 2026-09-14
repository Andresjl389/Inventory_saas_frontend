"use client";

import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import { usePermission } from "@/providers/session-provider";

import { useCategories } from "../hooks/use-categories";
import { useDeleteCategory } from "../hooks/use-category-mutations";
import type { Category } from "../types/category.types";
import { CategoryFormDialog } from "./category-form-dialog";

const column = createDataTableColumns<Category>();

export function CategoriesView() {
  const canWrite = usePermission("categories.write");
  const categories = useCategories();
  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  /**
   * `GET /categories` devuelve la lista completa (sin paginar), asi que aqui
   * el filtro si puede ser local. Si algun dia se pagina, este filtro tiene
   * que moverse al servidor.
   */
  const rows = useMemo(() => {
    const all = categories.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description ?? "").toLowerCase().includes(term),
    );
  }, [categories.data, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("name", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Nombre" />,
          cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        }),
        column.accessor((row) => row.description ?? "", {
          id: "description",
          header: () => <span>Descripcion</span>,
          enableSorting: false,
          cell: ({ getValue }) => {
            const value = getValue();
            return value ? (
              <span className="line-clamp-1 text-muted-foreground">{value}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            );
          },
        }),
        column.accessor("created_at", {
          header: ({ column: col }) => <DataTableColumnHeader column={col} title="Creada" />,
          meta: { width: "10rem" },
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{formatDate(getValue())}</span>
          ),
        }),
        column.display({
          id: "actions",
          meta: { width: "3.5rem" },
          cell: ({ row }) =>
            canWrite ? (
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Acciones de ${row.original.name}`}
                    >
                      <MoreHorizontal aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(row.original);
                        setFormOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Pencil className="size-4" aria-hidden />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setPendingDelete(row.original)}
                      className="gap-2"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null,
        }),
      ]),
    [canWrite],
  );

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Categorias"
          description="Agrupan el catalogo. Un producto puede quedarse sin categoria."
          actions={
            canWrite ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden />
                Nueva categoria
              </Button>
            ) : null
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <SearchInput
            defaultValue={search}
            onChange={setSearch}
            placeholder="Buscar categoria..."
            label="Buscar categorias"
            className="w-full sm:max-w-xs"
          />
        </DataTableToolbar>
      </Reveal>

      <Reveal delay={0.14}>
        <DataTable
        columns={columns}
        data={rows}
        isLoading={categories.isPending}
        isFetching={categories.isFetching && !categories.isPending}
        error={categories.error}
        onRetry={() => categories.refetch()}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Tags}
            title={search ? "Ninguna categoria coincide" : "Todavia no hay categorias"}
            description={
              search
                ? "Prueba con otro termino de busqueda."
                : "Crea categorias para organizar tu catalogo desde el principio."
            }
            action={
              !search && canWrite ? (
                <Button size="sm" onClick={openCreate}>
                  <Plus aria-hidden />
                  Nueva categoria
                </Button>
              ) : null
            }
          />
        }
      />

      </Reveal>

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        destructive
        loading={deleteCategory.isPending}
        title={`Eliminar ${pendingDelete?.name}?`}
        description="Los productos de esta categoria se quedaran sin categoria. La accion no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteCategory.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
