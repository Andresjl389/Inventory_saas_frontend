"use client";

import { MoreHorizontal, PackageCheck, PackageX, Pencil } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermission } from "@/providers/session-provider";

import { useToggleProductActive } from "../hooks/use-product-mutations";
import type { Product } from "../types/product.types";

export function ProductRowActions({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: (product: Product) => void;
}) {
  const canUpdate = usePermission("products.update");
  const canDelete = usePermission("products.delete");
  const toggleActive = useToggleProductActive();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!canUpdate && !canDelete) return null;

  const handleToggle = () => {
    toggleActive.mutate(
      { productId: product.id, isActive: product.is_active },
      { onSettled: () => setConfirmOpen(false) },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${product.name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canUpdate ? (
            <DropdownMenuItem onSelect={() => onEdit(product)} className="gap-2">
              <Pencil className="size-4" aria-hidden />
              Editar
            </DropdownMenuItem>
          ) : null}

          {product.is_active
            ? canDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setConfirmOpen(true)}
                  className="gap-2"
                >
                  <PackageX className="size-4" aria-hidden />
                  Desactivar
                </DropdownMenuItem>
              )
            : canUpdate && (
                <DropdownMenuItem onSelect={handleToggle} className="gap-2">
                  <PackageCheck className="size-4" aria-hidden />
                  Reactivar
                </DropdownMenuItem>
              )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive
        loading={toggleActive.isPending}
        title={`Desactivar ${product.name}?`}
        description="El producto deja de estar disponible para nuevas operaciones, pero se conserva en el historico. Puedes reactivarlo cuando quieras."
        confirmLabel="Desactivar"
        onConfirm={handleToggle}
      />
    </>
  );
}
