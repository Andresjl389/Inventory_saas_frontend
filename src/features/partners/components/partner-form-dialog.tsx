"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/config/documents";
import type { UseFormSetError } from "react-hook-form";

import {
  NO_DOCUMENT_TYPE,
  partnerSchema,
  type PartnerFormValues,
  type PartnerInput,
} from "../schemas/partner.schema";
import type { Partner, PartnerCopy } from "../types/partner.types";

function toFormValues(partner: Partner | null | undefined, withCreditLimit: boolean): PartnerFormValues {
  return {
    name: partner?.name ?? "",
    document_type: partner?.document_type ?? NO_DOCUMENT_TYPE,
    document_number: partner?.document_number ?? "",
    email: partner?.email ?? "",
    phone: partner?.phone ?? "",
    address: partner?.address ?? "",
    credit_limit: withCreditLimit ? String(Number(partner?.credit_limit ?? 0)) : undefined,
  };
}

/**
 * Formulario compartido por clientes y proveedores. No conoce la API: recibe
 * `onSubmit` y quien lo usa decide que mutacion dispara.
 */
export function PartnerFormDialog({
  open,
  onOpenChange,
  partner,
  copy,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  copy: PartnerCopy;
  pending: boolean;
  onSubmit: (
    values: PartnerInput,
    setError: UseFormSetError<PartnerFormValues>,
  ) => void;
}) {
  const isEdit = Boolean(partner);
  const withCreditLimit = Boolean(copy.withCreditLimit);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<PartnerFormValues, unknown, PartnerInput>({
    resolver: zodResolver(partnerSchema),
    defaultValues: toFormValues(partner, withCreditLimit),
  });

  useEffect(() => {
    if (open) reset(toFormValues(partner, withCreditLimit));
  }, [open, partner, withCreditLimit, reset]);

  const documentType = useWatch({ control, name: "document_type" }) ?? NO_DOCUMENT_TYPE;

  const submit = handleSubmit((values) => onSubmit(values, setError));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar ${copy.singular}` : copy.newLabel}
          </DialogTitle>
          <DialogDescription>
            Solo el nombre es obligatorio; el resto sirve para facturar y contactar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FormField id="partner-name" label="Nombre" required error={errors.name?.message}>
              <Input
                id="partner-name"
                autoFocus
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="partner-document-type"
                label="Tipo de documento"
                error={errors.document_type?.message}
              >
                <Select
                  value={documentType}
                  onValueChange={(value) =>
                    setValue("document_type", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="partner-document-type" className="w-full">
                    <SelectValue placeholder="Sin documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DOCUMENT_TYPE}>Sin documento</SelectItem>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DOCUMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                id="partner-document-number"
                label="Numero de documento"
                error={errors.document_number?.message}
              >
                <Input
                  id="partner-document-number"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.document_number)}
                  {...register("document_number")}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="partner-email" label="Correo" error={errors.email?.message}>
                <Input
                  id="partner-email"
                  type="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
              </FormField>

              <FormField id="partner-phone" label="Telefono" error={errors.phone?.message}>
                <Input
                  id="partner-phone"
                  type="tel"
                  aria-invalid={Boolean(errors.phone)}
                  {...register("phone")}
                />
              </FormField>
            </div>

            <FormField id="partner-address" label="Direccion" error={errors.address?.message}>
              <Textarea
                id="partner-address"
                rows={2}
                aria-invalid={Boolean(errors.address)}
                {...register("address")}
              />
            </FormField>

            {withCreditLimit ? (
              <FormField
                id="partner-credit-limit"
                label="Cupo de fiado"
                error={errors.credit_limit?.message}
                description="Hasta cuanto se le puede fiar. 0 = sin tope. Una venta que lo supere se rechaza."
              >
                <Input
                  id="partner-credit-limit"
                  inputMode="decimal"
                  className="tnum"
                  aria-invalid={Boolean(errors.credit_limit)}
                  {...register("credit_limit")}
                />
              </FormField>
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
              {isEdit ? "Guardar cambios" : copy.newLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
