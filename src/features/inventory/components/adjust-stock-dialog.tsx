"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductCombobox } from "@/features/products/components/product-combobox";
import type { Product } from "@/features/products/types/product.types";
import { WarehouseSelect } from "@/features/warehouses/components/warehouse-select";
import { handleFormError } from "@/lib/forms";
import { cn } from "cn";

import { useAdjustStock } from "../hooks/use-stock-mutations";
import {
  adjustStockFormSchema,
  toAdjustCommand,
  type AdjustStockFormFields,
  type AdjustStockFormInput,
} from "../schemas/inventory.schema";

const EMPTY: AdjustStockFormFields = {
  product_id: "",
  warehouse_id: "",
  direction: "in",
  quantity: "",
  notes: "",
};

/**
 * Ajuste manual de existencias: recuentos, roturas y mermas.
 *
 * Todo lo que no venga de una venta, una compra o un traslado entra por aqui,
 * y queda registrado en movimientos como ADJUSTMENT / MANUAL.
 */
export function AdjustStockDialog({
  open,
  onOpenChange,
  product,
  warehouseId,
  onProductChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preseleccion al ajustar desde una fila concreta del inventario. */
  product?: Product | null;
  warehouseId?: string | null;
  onProductChange: (product: Product | null) => void;
}) {
  const adjust = useAdjustStock();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<AdjustStockFormFields, unknown, AdjustStockFormInput>({
    resolver: zodResolver(adjustStockFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset({
      ...EMPTY,
      product_id: product?.id ?? "",
      warehouse_id: warehouseId ?? "",
    });
  }, [open, product, warehouseId, reset]);

  const direction = useWatch({ control, name: "direction" }) ?? "in";
  const selectedWarehouse = useWatch({ control, name: "warehouse_id" }) || null;

  const onSubmit = handleSubmit((values) => {
    adjust.mutate(toAdjustCommand(values), {
      onSuccess: () => onOpenChange(false),
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustar existencias</DialogTitle>
          <DialogDescription>
            Para recuentos, roturas y mermas. Queda registrado en el historial de movimientos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField
              id="adjust-product"
              label="Producto"
              required
              error={errors.product_id?.message}
            >
              <ProductCombobox
                id="adjust-product"
                value={product ?? null}
                onSelect={(next) => {
                  onProductChange(next);
                  setValue("product_id", next.id, { shouldValidate: true });
                }}
              />
            </FormField>

            <FormField
              id="adjust-warehouse"
              label="Bodega"
              required
              error={errors.warehouse_id?.message}
            >
              <WarehouseSelect
                id="adjust-warehouse"
                className="w-full"
                value={selectedWarehouse}
                onChange={(next) =>
                  setValue("warehouse_id", next ?? "", { shouldValidate: true })
                }
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <FormField id="adjust-direction" label="Tipo de ajuste" required>
                {/* Radiogroup con aspecto de segmentado: el signo nunca se teclea. */}
                <div
                  role="radiogroup"
                  aria-label="Tipo de ajuste"
                  className="grid grid-cols-2 gap-1 rounded-lg border border-white/50 bg-white/55 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/6"
                >
                  {(
                    [
                      { value: "in", label: "Entrada", icon: Plus },
                      { value: "out", label: "Salida", icon: Minus },
                    ] as const
                  ).map((option) => {
                    const active = direction === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setValue("direction", option.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-300",
                          active
                            ? option.value === "in"
                              ? "bg-success/15 font-medium text-success"
                              : "bg-destructive/15 font-medium text-destructive"
                            : "text-muted-foreground hover:bg-foreground/5",
                        )}
                      >
                        <option.icon className="size-3.5" aria-hidden />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField
                id="adjust-quantity"
                label="Cantidad"
                required
                error={errors.quantity?.message}
              >
                <Input
                  id="adjust-quantity"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.quantity)}
                  className="tnum"
                  placeholder="0"
                  {...register("quantity")}
                />
              </FormField>
            </div>

            <FormField
              id="adjust-notes"
              label="Motivo"
              error={errors.notes?.message}
              description="Opcional, pero es lo que explica el ajuste dentro de seis meses."
            >
              <Textarea
                id="adjust-notes"
                rows={2}
                aria-invalid={Boolean(errors.notes)}
                placeholder="Recuento fisico de enero"
                {...register("notes")}
              />
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adjust.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Registrar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
