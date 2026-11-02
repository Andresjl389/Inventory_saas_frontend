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
import { handleFormError } from "@/lib/forms";

import { useCreateAdminUser, useUpdateAdminUser } from "../hooks/use-platform";
import {
  updateUserSchema,
  userSchema,
  type UpdateUserFormValues,
  type UpdateUserInput,
  type UserFormValues,
  type UserInput,
} from "../schemas/platform.schema";
import type { AdminUser } from "../types/platform.types";

const EMPTY: UserFormValues = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  is_superuser: false,
};

export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateAdminUser();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<UserFormValues, unknown, UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const isSuperuser = useWatch({ control, name: "is_superuser" }) ?? false;

  const onSubmit = handleSubmit((values) => {
    createUser.mutate(values, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear cuenta</DialogTitle>
          <DialogDescription>
            Una cuenta de la plataforma. Para que entre a una empresa, agregala como miembro desde
            esa empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField id="user-email" label="Correo" required error={errors.email?.message}>
              <Input id="user-email" type="email" autoFocus {...register("email")} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="user-first" label="Nombre" required error={errors.first_name?.message}>
                <Input id="user-first" {...register("first_name")} />
              </FormField>
              <FormField id="user-last" label="Apellido" required error={errors.last_name?.message}>
                <Input id="user-last" {...register("last_name")} />
              </FormField>
            </div>

            <FormField
              id="user-password"
              label="Contrasena inicial"
              required
              error={errors.password?.message}
            >
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </FormField>

            <div className="flex items-start gap-2 rounded-xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
              <Checkbox
                id="user-superuser"
                checked={isSuperuser}
                onCheckedChange={(checked) => setValue("is_superuser", checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="user-superuser" className="text-sm font-normal leading-snug">
                Administrador de plataforma
                <span className="block text-xs text-muted-foreground">
                  Podra entrar a esta zona y operar cualquier empresa. Dalo con cuidado.
                </span>
              </Label>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUser.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Crear cuenta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toUpdateValues(user: AdminUser | null): UpdateUserFormValues {
  return {
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    password: "",
    is_active: user?.is_active ?? true,
    is_superuser: user?.is_superuser ?? false,
  };
}

export function EditUserDialog({
  user,
  onOpenChange,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateUser = useUpdateAdminUser();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<UpdateUserFormValues, unknown, UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: toUpdateValues(user),
  });

  useEffect(() => {
    if (user) reset(toUpdateValues(user));
  }, [user, reset]);

  const isActive = useWatch({ control, name: "is_active" }) ?? true;
  const isSuperuser = useWatch({ control, name: "is_superuser" }) ?? false;

  const onSubmit = handleSubmit((values) => {
    if (!user) return;
    updateUser.mutate(
      { userId: user.id, input: values },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => handleFormError(error, setError),
      },
    );
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="edit-first"
                label="Nombre"
                required
                error={errors.first_name?.message}
              >
                <Input id="edit-first" autoFocus {...register("first_name")} />
              </FormField>
              <FormField
                id="edit-last"
                label="Apellido"
                required
                error={errors.last_name?.message}
              >
                <Input id="edit-last" {...register("last_name")} />
              </FormField>
            </div>

            <FormField
              id="edit-password"
              label="Nueva contrasena"
              error={errors.password?.message}
              description="Dejalo vacio para no cambiarla."
            >
              <Input
                id="edit-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </FormField>

            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                <Checkbox
                  id="edit-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("is_active", checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="edit-active" className="text-sm font-normal leading-snug">
                  Cuenta activa
                  <span className="block text-xs text-muted-foreground">
                    Al desactivarla no podra iniciar sesion en ninguna empresa.
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                <Checkbox
                  id="edit-superuser"
                  checked={isSuperuser}
                  onCheckedChange={(checked) => setValue("is_superuser", checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="edit-superuser" className="text-sm font-normal leading-snug">
                  Administrador de plataforma
                  <span className="block text-xs text-muted-foreground">
                    Acceso total a esta zona y a cualquier empresa.
                  </span>
                </Label>
              </div>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateUser.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
