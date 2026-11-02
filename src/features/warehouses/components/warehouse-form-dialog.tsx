"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

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
import { handleFormError } from "@/lib/forms";

import { useCreateWarehouse, useUpdateWarehouse } from "../hooks/use-warehouse-mutations";
import {
  warehouseSchema,
  type WarehouseFormValues,
  type WarehouseInput,
} from "../schemas/warehouse.schema";
import type { Warehouse } from "../types/warehouse.types";

function toFormValues(warehouse?: Warehouse | null): WarehouseFormValues {
  return {
    name: warehouse?.name ?? "",
    address: warehouse?.address ?? "",
  };
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
}) {
  const isEdit = Boolean(warehouse);
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const pending = createWarehouse.isPending || updateWarehouse.isPending;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues, unknown, WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: toFormValues(warehouse),
  });

  useEffect(() => {
    if (open) reset(toFormValues(warehouse));
  }, [open, warehouse, reset]);

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => handleFormError(error, setError),
    };

    if (warehouse) {
      updateWarehouse.mutate({ warehouseId: warehouse.id, input: values }, options);
    } else {
      createWarehouse.mutate(values, options);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar bodega" : "Nueva bodega"}</DialogTitle>
          <DialogDescription>
            Las bodegas guardan el stock. Cada movimiento de inventario apunta a una.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="warehouse-name" label="Nombre" required error={errors.name?.message}>
              <Input
                id="warehouse-name"
                autoFocus
                aria-invalid={Boolean(errors.name)}
                placeholder="Bodega principal"
                {...register("name")}
              />
            </FormField>

            <FormField id="warehouse-address" label="Direccion" error={errors.address?.message}>
              <Textarea
                id="warehouse-address"
                rows={2}
                aria-invalid={Boolean(errors.address)}
                {...register("address")}
              />
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {isEdit ? "Guardar cambios" : "Crear bodega"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
