"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { handleFormError } from "@/lib/forms";

import { useCreateCompany } from "../hooks/use-create-company";
import {
  createCompanySchema,
  type CreateCompanyFormValues,
  type CreateCompanyInput,
} from "../schemas/company.schema";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "../types/company.types";

const EMPTY: CreateCompanyFormValues = {
  name: "",
  legal_name: "",
  document_type: undefined,
  document_number: "",
  email: "",
  phone: "",
};

export function CreateCompanyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createCompany = useCreateCompany();

  const form = useForm<CreateCompanyFormValues, unknown, CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: EMPTY,
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = form;

  const documentType = useWatch({ control, name: "document_type" });

  const onSubmit = handleSubmit((values) => {
    createCompany.mutate(values, {
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(EMPTY);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear empresa</DialogTitle>
          <DialogDescription>
            Quedaras como propietario y podras invitar a tu equipo despues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="company-name" label="Nombre" required error={errors.name?.message}>
              <Input
                id="company-name"
                autoFocus
                aria-invalid={Boolean(errors.name)}
                placeholder="Mi empresa"
                {...register("name")}
              />
            </FormField>

            <FormField
              id="company-legal-name"
              label="Razon social"
              error={errors.legal_name?.message}
            >
              <Input
                id="company-legal-name"
                aria-invalid={Boolean(errors.legal_name)}
                {...register("legal_name")}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="company-document-type"
                label="Tipo de documento"
                error={errors.document_type?.message}
              >
                <Select
                  value={documentType ?? ""}
                  onValueChange={(value) =>
                    setValue("document_type", value as CreateCompanyFormValues["document_type"], {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="company-document-type" className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DOCUMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                id="company-document-number"
                label="Numero"
                error={errors.document_number?.message}
              >
                <Input
                  id="company-document-number"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.document_number)}
                  {...register("document_number")}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="company-email" label="Correo" error={errors.email?.message}>
                <Input
                  id="company-email"
                  type="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
              </FormField>

              <FormField id="company-phone" label="Telefono" error={errors.phone?.message}>
                <Input
                  id="company-phone"
                  type="tel"
                  aria-invalid={Boolean(errors.phone)}
                  {...register("phone")}
                />
              </FormField>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCompany.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCompany.isPending}>
              {createCompany.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Crear empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
