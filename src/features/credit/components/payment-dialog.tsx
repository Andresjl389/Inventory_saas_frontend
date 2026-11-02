"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Landmark, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
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
import { formatMoney } from "@/lib/format";
import { handleFormError } from "@/lib/forms";

import { useRegisterPayment } from "../hooks/use-credit-mutations";
import {
  paymentSchema,
  type PaymentFormValues,
  type PaymentInput,
} from "../schemas/credit.schema";
import { PAYMENT_METHOD_LABELS, type AbonoMethod } from "../types/credit.types";

const METHOD_OPTIONS = [
  { value: "CASH", label: PAYMENT_METHOD_LABELS.CASH, icon: Banknote },
  { value: "TRANSFER", label: PAYMENT_METHOD_LABELS.TRANSFER, icon: Landmark },
] as const;

/**
 * Registrar un abono: "me abona 10 mil" es el 90% de los casos, asi que el
 * dialogo pide el monto primero y ofrece saldar todo de un toque.
 */
export function PaymentDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  owes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  owes: number;
}) {
  const register = useRegisterPayment(customerId);
  const schema = useMemo(() => paymentSchema(owes), [owes]);

  const {
    control,
    register: field,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues, unknown, PaymentInput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", method: "CASH", notes: "" },
  });

  useEffect(() => {
    if (open) reset({ amount: "", method: "CASH", notes: "" });
  }, [open, reset]);

  const method = (useWatch({ control, name: "method" }) ?? "CASH") as AbonoMethod;

  const onSubmit = handleSubmit((values) => {
    register.mutate(values, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => handleFormError(error, setError, { PAYMENT_EXCEEDS_BALANCE: "amount" }),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar abono</DialogTitle>
          <DialogDescription>
            {customerName} debe {formatMoney(owes)}. El abono baja el saldo y queda en el
            historial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="payment-amount" label="Monto" required error={errors.amount?.message}>
              <div className="flex gap-2">
                <Input
                  id="payment-amount"
                  autoFocus
                  inputMode="decimal"
                  className="tnum"
                  placeholder="0"
                  aria-invalid={Boolean(errors.amount)}
                  {...field("amount")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() =>
                    setValue("amount", String(owes), { shouldValidate: true, shouldDirty: true })
                  }
                >
                  Todo
                </Button>
              </div>
            </FormField>

            <FormField id="payment-method" label="Como pago" required>
              <SegmentedControl
                id="payment-method"
                label="Como pago"
                value={method}
                options={METHOD_OPTIONS}
                onChange={(next) => setValue("method", next)}
              />
            </FormField>

            <FormField id="payment-notes" label="Nota" error={errors.notes?.message}>
              <Textarea
                id="payment-notes"
                rows={2}
                placeholder="Abono del viernes"
                aria-invalid={Boolean(errors.notes)}
                {...field("notes")}
              />
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={register.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Registrar abono
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
