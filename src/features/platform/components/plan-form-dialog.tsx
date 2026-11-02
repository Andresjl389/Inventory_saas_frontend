"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toNumber } from "@/lib/format";
import { handleFormError } from "@/lib/forms";

import { useCreatePlan, useUpdatePlan } from "../hooks/use-platform";
import {
  planSchema,
  updatePlanSchema,
  type PlanFormValues,
  type PlanInput,
  type UpdatePlanInput,
} from "../schemas/platform.schema";
import type { Plan } from "../types/platform.types";

type Values = PlanFormValues & { is_active?: boolean };

function toFormValues(plan?: Plan | null): Values {
  return {
    code: plan?.code ?? "",
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    price_monthly: plan ? String(toNumber(plan.price_monthly)) : "0",
    max_users: plan?.max_users ?? 0,
    max_products: plan?.max_products ?? 0,
    max_warehouses: plan?.max_warehouses ?? 0,
    is_active: plan?.is_active ?? true,
  };
}

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
}) {
  const isEdit = Boolean(plan);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const pending = createPlan.isPending || updatePlan.isPending;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values, unknown, PlanInput | UpdatePlanInput>({
    resolver: zodResolver(isEdit ? updatePlanSchema : planSchema) as never,
    defaultValues: toFormValues(plan),
  });

  useEffect(() => {
    if (open) reset(toFormValues(plan));
  }, [open, plan, reset]);

  const isActive = useWatch({ control, name: "is_active" }) ?? true;

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => handleFormError(error, setError),
    };

    if (plan) {
      updatePlan.mutate({ planId: plan.id, input: values as UpdatePlanInput }, options);
    } else {
      createPlan.mutate(values as PlanInput, options);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar ${plan?.name}` : "Nuevo plan"}</DialogTitle>
          <DialogDescription>
            Un limite en 0 significa sin limite.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="plan-code"
                label="Codigo"
                required
                error={errors.code?.message}
                description={isEdit ? "No se puede cambiar." : "Por ejemplo: PRO"}
              >
                <Input
                  id="plan-code"
                  disabled={isEdit}
                  autoFocus={!isEdit}
                  className="font-mono uppercase"
                  {...register("code")}
                />
              </FormField>

              <FormField id="plan-name" label="Nombre" required error={errors.name?.message}>
                <Input id="plan-name" autoFocus={isEdit} {...register("name")} />
              </FormField>
            </div>

            <FormField id="plan-description" label="Descripcion" error={errors.description?.message}>
              <Textarea id="plan-description" rows={2} {...register("description")} />
            </FormField>

            <FormField
              id="plan-price"
              label="Precio mensual"
              required
              error={errors.price_monthly?.message}
            >
              <Input id="plan-price" inputMode="decimal" className="tnum" {...register("price_monthly")} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="plan-users" label="Usuarios" error={errors.max_users?.message}>
                <Input id="plan-users" inputMode="numeric" className="tnum" {...register("max_users")} />
              </FormField>
              <FormField id="plan-products" label="Productos" error={errors.max_products?.message}>
                <Input
                  id="plan-products"
                  inputMode="numeric"
                  className="tnum"
                  {...register("max_products")}
                />
              </FormField>
              <FormField
                id="plan-warehouses"
                label="Bodegas"
                error={errors.max_warehouses?.message}
              >
                <Input
                  id="plan-warehouses"
                  inputMode="numeric"
                  className="tnum"
                  {...register("max_warehouses")}
                />
              </FormField>
            </div>

            {isEdit ? (
              <div className="flex items-start gap-2 rounded-xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                <Checkbox
                  id="plan-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("is_active", checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="plan-active" className="text-sm font-normal leading-snug">
                  Plan activo
                  <span className="block text-xs text-muted-foreground">
                    Un plan inactivo deja de ofrecerse en altas nuevas.
                  </span>
                </Label>
              </div>
            ) : null}
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
              {isEdit ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
