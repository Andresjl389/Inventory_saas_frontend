"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/shared/form-field";
import { SegmentedControl } from "@/components/shared/segmented-control";
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

import { useAdjustAccount } from "../hooks/use-credit-mutations";
import {
  adjustAccountFormSchema,
  toAdjustAccountCommand,
  type AdjustAccountFormFields,
  type AdjustAccountFormInput,
} from "../schemas/credit.schema";

const DIRECTION_OPTIONS = [
  {
    value: "decrease",
    label: "Baja la deuda",
    icon: Minus,
    activeClassName: "bg-success/15 font-medium text-success",
  },
  {
    value: "increase",
    label: "Sube la deuda",
    icon: Plus,
    activeClassName: "bg-destructive/15 font-medium text-destructive",
  },
] as const;

/**
 * Correccion manual de la cuenta. Tambien es como se salda un saldo a favor
 * del cliente: cuando la tienda le entrega la plata, la deuda "sube" hasta 0.
 */
export function AdjustAccountDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  inFavor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  /** Lo que la tienda le debe al cliente; con saldo a favor el ajuste tipico es subir. */
  inFavor: number;
}) {
  const adjust = useAdjustAccount(customerId);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<AdjustAccountFormFields, unknown, AdjustAccountFormInput>({
    resolver: zodResolver(adjustAccountFormSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      inFavor > 0
        ? { direction: "increase", amount: String(inFavor), notes: "Se le devolvio el saldo a favor" }
        : { direction: "decrease", amount: "", notes: "" },
    );
  }, [open, inFavor, reset]);

  const direction = useWatch({ control, name: "direction" }) ?? "decrease";

  const onSubmit = handleSubmit((values) => {
    adjust.mutate(toAdjustAccountCommand(values), {
      onSuccess: () => onOpenChange(false),
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar la cuenta de {customerName}</DialogTitle>
          <DialogDescription>
            Para perdonar una deuda, corregir un error o devolver un saldo a favor. Queda en el
            historial con su explicacion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="adjust-account-direction" label="Tipo de ajuste" required>
              <SegmentedControl
                id="adjust-account-direction"
                label="Tipo de ajuste"
                value={direction}
                options={DIRECTION_OPTIONS}
                onChange={(next) => setValue("direction", next)}
              />
            </FormField>

            <FormField
              id="adjust-account-amount"
              label="Monto"
              required
              error={errors.amount?.message}
            >
              <Input
                id="adjust-account-amount"
                inputMode="decimal"
                className="tnum"
                placeholder="0"
                aria-invalid={Boolean(errors.amount)}
                {...register("amount")}
              />
            </FormField>

            <FormField
              id="adjust-account-notes"
              label="Motivo"
              required
              error={errors.notes?.message}
              description="Obligatorio: un ajuste sin explicacion es lo que vuelve turbias las cuentas."
            >
              <Textarea
                id="adjust-account-notes"
                rows={2}
                aria-invalid={Boolean(errors.notes)}
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
