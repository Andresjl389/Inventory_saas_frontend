"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { roleDescription } from "@/config/permissions";
import { RoleSelect } from "@/features/roles/components/role-select";
import { isApiError } from "@/lib/api/errors";
import { handleFormError } from "@/lib/forms";

import { useAddMember } from "../hooks/use-company-members";
import {
  addMemberSchema,
  type AddMemberFormValues,
  type AddMemberInput,
} from "../schemas/company.schema";

const EMPTY: AddMemberFormValues = {
  email: "",
  role: "SELLER",
  withAccount: false,
  password: "",
  first_name: "",
  last_name: "",
};

/**
 * Agregar a alguien a la empresa.
 *
 * Si el correo ya tiene cuenta basta con el rol. Si no, el backend responde
 * `ACCOUNT_DETAILS_REQUIRED` y aqui aparecen los campos para crearla en el
 * mismo paso, sin obligar a la persona a registrarse antes.
 */
export function AddMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addMember = useAddMember();
  const [needsAccount, setNeedsAccount] = useState(false);

  const form = useForm<AddMemberFormValues, unknown, AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
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

  const role = useWatch({ control, name: "role" });

  const close = (next: boolean) => {
    if (!next) {
      reset(EMPTY);
      setNeedsAccount(false);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => {
    addMember.mutate(values, {
      onSuccess: () => close(false),
      onError: (error) => {
        if (isApiError(error) && error.code === "ACCOUNT_DETAILS_REQUIRED") {
          // El correo no tiene cuenta: se piden los datos y se reintenta.
          setNeedsAccount(true);
          setValue("withAccount", true, { shouldValidate: false });
          return;
        }
        handleFormError(error, setError);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar miembro</DialogTitle>
          <DialogDescription>
            {needsAccount
              ? "Ese correo todavia no tiene cuenta. Completa sus datos y se creara junto con el acceso."
              : "Escribe el correo de la persona. Si aun no tiene cuenta, la crearemos en el siguiente paso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="member-email" label="Correo" required error={errors.email?.message}>
              <Input
                id="member-email"
                type="email"
                autoFocus
                aria-invalid={Boolean(errors.email)}
                placeholder="persona@empresa.com"
                {...register("email")}
              />
            </FormField>

            <FormField
              id="member-role"
              label="Rol"
              required
              error={errors.role?.message}
              description={roleDescription(role)}
            >
              <RoleSelect
                id="member-role"
                className="w-full"
                value={role}
                onChange={(value) => setValue("role", value, { shouldDirty: true })}
              />
            </FormField>

            {needsAccount ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="member-first-name"
                    label="Nombre"
                    required
                    error={errors.first_name?.message}
                  >
                    <Input
                      id="member-first-name"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.first_name)}
                      {...register("first_name")}
                    />
                  </FormField>

                  <FormField
                    id="member-last-name"
                    label="Apellido"
                    required
                    error={errors.last_name?.message}
                  >
                    <Input
                      id="member-last-name"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.last_name)}
                      {...register("last_name")}
                    />
                  </FormField>
                </div>

                <FormField
                  id="member-password"
                  label="Contrasena inicial"
                  required
                  error={errors.password?.message}
                  description="Minimo 8 caracteres. Compartesela para que pueda entrar y cambiarla."
                >
                  <Input
                    id="member-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                </FormField>
              </>
            ) : null}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              disabled={addMember.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addMember.isPending}>
              {addMember.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {needsAccount ? "Crear cuenta y agregar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
