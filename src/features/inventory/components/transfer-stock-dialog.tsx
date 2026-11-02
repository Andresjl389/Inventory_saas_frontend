"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
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

import { useTransferStock } from "../hooks/use-stock-mutations";
import {
  transferStockSchema,
  type TransferStockFormValues,
  type TransferStockInput,
} from "../schemas/inventory.schema";

const EMPTY: TransferStockFormValues = {
  product_id: "",
  source_warehouse_id: "",
  destination_warehouse_id: "",
  quantity: "",
  notes: "",
};

/**
 * Traslado entre bodegas. El backend lo resuelve en una sola transaccion y
 * deja dos movimientos (TRANSFER_OUT y TRANSFER_IN), asi que el stock total
 * de la empresa no cambia: solo cambia de sitio.
 */
export function TransferStockDialog({
  open,
  onOpenChange,
  product,
  sourceWarehouseId,
  onProductChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  sourceWarehouseId?: string | null;
  onProductChange: (product: Product | null) => void;
}) {
  const transfer = useTransferStock();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<TransferStockFormValues, unknown, TransferStockInput>({
    resolver: zodResolver(transferStockSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset({
      ...EMPTY,
      product_id: product?.id ?? "",
      source_warehouse_id: sourceWarehouseId ?? "",
    });
  }, [open, product, sourceWarehouseId, reset]);

  const source = useWatch({ control, name: "source_warehouse_id" }) || null;
  const destination = useWatch({ control, name: "destination_warehouse_id" }) || null;

  const onSubmit = handleSubmit((values) => {
    transfer.mutate(values, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Trasladar existencias</DialogTitle>
          <DialogDescription>
            Mueve stock entre bodegas. El total de la empresa no cambia, solo su ubicacion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField
              id="transfer-product"
              label="Producto"
              required
              error={errors.product_id?.message}
            >
              <ProductCombobox
                id="transfer-product"
                value={product ?? null}
                onSelect={(next) => {
                  onProductChange(next);
                  setValue("product_id", next.id, { shouldValidate: true });
                }}
              />
            </FormField>

            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <FormField
                id="transfer-source"
                label="Desde"
                required
                error={errors.source_warehouse_id?.message}
              >
                <WarehouseSelect
                  id="transfer-source"
                  className="w-full"
                  value={source}
                  onChange={(next) =>
                    setValue("source_warehouse_id", next ?? "", { shouldValidate: true })
                  }
                />
              </FormField>

              <ArrowRight
                className="mb-2.5 hidden size-4 shrink-0 text-muted-foreground sm:block"
                aria-hidden
              />

              <FormField
                id="transfer-destination"
                label="Hacia"
                required
                error={errors.destination_warehouse_id?.message}
              >
                <WarehouseSelect
                  id="transfer-destination"
                  className="w-full"
                  value={destination}
                  onChange={(next) =>
                    setValue("destination_warehouse_id", next ?? "", { shouldValidate: true })
                  }
                />
              </FormField>
            </div>

            <FormField
              id="transfer-quantity"
              label="Cantidad"
              required
              error={errors.quantity?.message}
              description="El backend rechaza el traslado si el origen no tiene suficiente."
            >
              <Input
                id="transfer-quantity"
                inputMode="decimal"
                aria-invalid={Boolean(errors.quantity)}
                className="tnum"
                placeholder="0"
                {...register("quantity")}
              />
            </FormField>

            <FormField id="transfer-notes" label="Motivo" error={errors.notes?.message}>
              <Textarea
                id="transfer-notes"
                rows={2}
                aria-invalid={Boolean(errors.notes)}
                placeholder="Reposicion de tienda"
                {...register("notes")}
              />
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={transfer.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={transfer.isPending}>
              {transfer.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Trasladar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
