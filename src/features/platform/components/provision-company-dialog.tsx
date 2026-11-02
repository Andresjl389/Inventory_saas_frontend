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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/config/documents";
import { handleFormError } from "@/lib/forms";

import { usePlans, useProvisionCompany } from "../hooks/use-platform";
import {
  NO_DOCUMENT_TYPE,
  NO_PLAN,
  provisionCompanySchema,
  type ProvisionCompanyFormValues,
  type ProvisionCompanyInput,
} from "../schemas/platform.schema";

const EMPTY: ProvisionCompanyFormValues = {
  name: "",
  owner_email: "",
  owner_exists: false,
  owner_password: "",
  owner_first_name: "",
  owner_last_name: "",
  legal_name: "",
  document_type: NO_DOCUMENT_TYPE,
  document_number: "",
  email: "",
  phone: "",
  plan_code: NO_PLAN,
};

/**
 * Alta de empresa desde plataforma: crea la empresa, le pone propietario y la
 * deja en un plan, todo en una llamada.
 */
export function ProvisionCompanyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const provision = useProvisionCompany();
  const plans = usePlans(true);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProvisionCompanyFormValues, unknown, ProvisionCompanyInput>({
    resolver: zodResolver(provisionCompanySchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const ownerExists = useWatch({ control, name: "owner_exists" }) ?? false;
  const documentType = useWatch({ control, name: "document_type" }) ?? NO_DOCUMENT_TYPE;
  const planCode = useWatch({ control, name: "plan_code" }) ?? NO_PLAN;

  const onSubmit = handleSubmit((values) => {
    // `owner_exists` es solo del formulario: no viaja a la API.
    const { owner_exists: existing, ...payload } = values;
    provision.mutate(
      { ...payload, owner_password: existing ? null : payload.owner_password },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dar de alta una empresa</DialogTitle>
          <DialogDescription>
            Se crea la empresa, se le asigna un propietario y se la pone en un plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="prov-name" label="Nombre" required error={errors.name?.message}>
              <Input id="prov-name" autoFocus placeholder="Acme Ferreteria" {...register("name")} />
            </FormField>

            <fieldset className="space-y-4 rounded-xl border border-white/50 p-4 dark:border-white/10">
              <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Propietario
              </legend>

              <FormField
                id="prov-owner-email"
                label="Correo"
                required
                error={errors.owner_email?.message}
              >
                <Input
                  id="prov-owner-email"
                  type="email"
                  placeholder="persona@empresa.com"
                  {...register("owner_email")}
                />
              </FormField>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="prov-owner-exists"
                  checked={ownerExists}
                  onCheckedChange={(checked) =>
                    setValue("owner_exists", checked === true, { shouldValidate: true })
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="prov-owner-exists" className="text-sm font-normal leading-snug">
                  La cuenta ya existe
                  <span className="block text-xs text-muted-foreground">
                    Si ya existe se reutiliza; si no, hay que darle una contrasena inicial.
                  </span>
                </Label>
              </div>

              {!ownerExists ? (
                <>
                  <FormField
                    id="prov-owner-password"
                    label="Contrasena inicial"
                    required
                    error={errors.owner_password?.message}
                  >
                    <Input
                      id="prov-owner-password"
                      type="password"
                      autoComplete="new-password"
                      {...register("owner_password")}
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id="prov-owner-first"
                      label="Nombre"
                      error={errors.owner_first_name?.message}
                    >
                      <Input id="prov-owner-first" {...register("owner_first_name")} />
                    </FormField>
                    <FormField
                      id="prov-owner-last"
                      label="Apellido"
                      error={errors.owner_last_name?.message}
                    >
                      <Input id="prov-owner-last" {...register("owner_last_name")} />
                    </FormField>
                  </div>
                </>
              ) : null}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="prov-legal" label="Razon social" error={errors.legal_name?.message}>
                <Input id="prov-legal" {...register("legal_name")} />
              </FormField>

              <FormField id="prov-plan" label="Plan">
                <Select
                  value={planCode}
                  onValueChange={(value) => setValue("plan_code", value, { shouldDirty: true })}
                >
                  <SelectTrigger id="prov-plan" className="w-full">
                    <SelectValue placeholder="Sin plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PLAN}>Sin plan</SelectItem>
                    {plans.data?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.code}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="prov-doc-type"
                label="Tipo de documento"
                error={errors.document_type?.message}
              >
                <Select
                  value={documentType}
                  onValueChange={(value) =>
                    setValue("document_type", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="prov-doc-type" className="w-full">
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
                id="prov-doc-number"
                label="Numero"
                error={errors.document_number?.message}
              >
                <Input id="prov-doc-number" inputMode="numeric" {...register("document_number")} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="prov-email" label="Correo de la empresa" error={errors.email?.message}>
                <Input id="prov-email" type="email" {...register("email")} />
              </FormField>
              <FormField id="prov-phone" label="Telefono" error={errors.phone?.message}>
                <Input id="prov-phone" type="tel" {...register("phone")} />
              </FormField>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={provision.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={provision.isPending}>
              {provision.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Crear empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
