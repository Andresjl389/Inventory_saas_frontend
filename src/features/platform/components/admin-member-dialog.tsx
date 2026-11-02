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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYSTEM_ROLES, roleDescription, roleLabel } from "@/config/permissions";
import {
  addMemberSchema,
  type AddMemberFormValues,
  type AddMemberInput,
} from "@/features/companies/schemas/company.schema";
import { memberRole, type CompanyMember } from "@/features/companies/types/company.types";
import { isApiError } from "@/lib/api/errors";
import { handleFormError } from "@/lib/forms";

import {
  useAddAdminCompanyMember,
  useChangeAdminCompanyMemberRole,
} from "../hooks/use-platform";

const EMPTY: AddMemberFormValues = {
  email: "",
  role: "ADMIN",
  withAccount: false,
  password: "",
  first_name: "",
  last_name: "",
};

/**
 * Alta de miembro desde la consola de plataforma.
 *
 * Existe para un caso concreto: una empresa que se quedo sin nadie que pueda
 * administrarla. Aqui solo se ofrecen los roles del sistema, porque los
 * propios de la empresa viven detras de `GET /roles`, que necesita un tenant
 * activo y el super admin no tiene ninguno.
 */
export function AdminMemberDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
}: {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addMember = useAddAdminCompanyMember(companyId);
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
              ? `Ese correo no tiene cuenta. Completa sus datos y se creara junto con el acceso a ${companyName}.`
              : `Daras acceso a ${companyName} sin pasar por los permisos de la empresa.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="admin-member-email" label="Correo" required error={errors.email?.message}>
              <Input
                id="admin-member-email"
                type="email"
                autoFocus
                aria-invalid={Boolean(errors.email)}
                placeholder="persona@empresa.com"
                {...register("email")}
              />
            </FormField>

            <FormField
              id="admin-member-role"
              label="Rol"
              required
              error={errors.role?.message}
              description={roleDescription(role)}
            >
              <Select
                value={role}
                onValueChange={(value) => setValue("role", value, { shouldDirty: true })}
              >
                <SelectTrigger id="admin-member-role" className="w-full">
                  <SelectValue placeholder="Elige un rol" />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_ROLES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {roleLabel(code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {needsAccount ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="admin-member-first-name"
                    label="Nombre"
                    required
                    error={errors.first_name?.message}
                  >
                    <Input
                      id="admin-member-first-name"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.first_name)}
                      {...register("first_name")}
                    />
                  </FormField>

                  <FormField
                    id="admin-member-last-name"
                    label="Apellido"
                    required
                    error={errors.last_name?.message}
                  >
                    <Input
                      id="admin-member-last-name"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.last_name)}
                      {...register("last_name")}
                    />
                  </FormField>
                </div>

                <FormField
                  id="admin-member-password"
                  label="Contrasena inicial"
                  required
                  error={errors.password?.message}
                  description="Minimo 8 caracteres. Compartesela para que pueda entrar y cambiarla."
                >
                  <Input
                    id="admin-member-password"
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

/**
 * Cambio de rol desde la plataforma. Mismo motivo que el alta: reparar una
 * empresa sin administrador. Solo roles del sistema, por lo dicho arriba.
 */
export function AdminChangeMemberRoleDialog({
  companyId,
  member,
  onOpenChange,
}: {
  companyId: string;
  member: CompanyMember | null;
  onOpenChange: (open: boolean) => void;
}) {
  const changeRole = useChangeAdminCompanyMemberRole(companyId);
  const current = member ? memberRole(member) : "";
  const [choice, setChoice] = useState<string | null>(null);
  const role = choice ?? current;

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>{member?.full_name}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <FormField id="admin-role-change" label="Rol" description={roleDescription(role)}>
            <Select value={role} onValueChange={setChoice}>
              <SelectTrigger id="admin-role-change" className="w-full">
                <SelectValue placeholder="Elige un rol" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_ROLES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {roleLabel(code)}
                  </SelectItem>
                ))}
                {/* Un rol propio de la empresa no esta en esta lista, pero si
                    lo tiene asignado hay que poder conservarlo. */}
                {current && !(SYSTEM_ROLES as readonly string[]).includes(current) ? (
                  <SelectItem value={current}>{roleLabel(current)}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </FormField>
        </FieldGroup>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changeRole.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={changeRole.isPending || role === current || !member}
            onClick={() =>
              member &&
              changeRole.mutate(
                { userId: member.user_id, input: { role } },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {changeRole.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
