"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
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
import { WILDCARD } from "@/config/permissions";
import { handleFormError } from "@/lib/forms";

import { useCreateRole, useUpdateRole } from "../hooks/use-role-mutations";
import { usePermissionCatalog } from "../hooks/use-roles";
import {
  roleSchema,
  type RoleFormValues,
  type RoleInput,
} from "../schemas/role.schema";
import {
  HIDDEN_PERMISSION_MODULES,
  displayRoleName,
  moduleLabel,
  type Role,
} from "../types/role.types";

function toFormValues(role?: Role | null): RoleFormValues {
  return {
    code: role?.code ?? "",
    name: role?.name ?? "",
    description: role?.description ?? "",
    permissions: role?.permissions ?? [],
  };
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}) {
  const isEdit = Boolean(role);
  const catalog = usePermissionCatalog({ enabled: open });
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const pending = createRole.isPending || updateRole.isPending;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues, unknown, RoleInput>({
    resolver: zodResolver(roleSchema),
    defaultValues: toFormValues(role),
  });

  useEffect(() => {
    if (open) reset(toFormValues(role));
  }, [open, role, reset]);

  const selected = useWatch({ control, name: "permissions" }) ?? [];
  const catalogItems = catalog.data;

  /** El comodin se gestiona aparte: no es un permiso que se marque a mano. */
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof catalogItems>();
    for (const permission of catalogItems ?? []) {
      if (permission.code === WILDCARD) continue;
      if (HIDDEN_PERMISSION_MODULES.has(permission.module)) continue;
      const list = groups.get(permission.module) ?? [];
      list.push(permission);
      groups.set(permission.module, list);
    }
    return [...groups.entries()];
  }, [catalogItems]);

  const toggle = (code: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...selected, code])]
      : selected.filter((item) => item !== code);
    setValue("permissions", next, { shouldDirty: true });
  };

  const onSubmit = handleSubmit((values) => {
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: unknown) => handleFormError(error, setError),
    };

    if (role) {
      // El codigo no se envia al editar: es la clave del rol.
      const { code, ...rest } = values;
      void code;
      updateRole.mutate({ roleId: role.id, input: rest }, options);
    } else {
      createRole.mutate(values, options);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit && role ? `Editar ${displayRoleName(role)}` : "Nuevo rol"}
          </DialogTitle>
          <DialogDescription>
            Un rol propio de la empresa. Elige exactamente lo que puede hacer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="role-code"
                label="Codigo"
                required
                error={errors.code?.message}
                description={isEdit ? "El codigo no se puede cambiar." : "Por ejemplo: CAJERO"}
              >
                <Input
                  id="role-code"
                  autoFocus={!isEdit}
                  disabled={isEdit}
                  aria-invalid={Boolean(errors.code)}
                  className="font-mono uppercase"
                  {...register("code")}
                />
              </FormField>

              <FormField id="role-name" label="Nombre" required error={errors.name?.message}>
                <Input
                  id="role-name"
                  autoFocus={isEdit}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Cajero"
                  {...register("name")}
                />
              </FormField>
            </div>

            <FormField id="role-description" label="Descripcion" error={errors.description?.message}>
              <Textarea id="role-description" rows={2} {...register("description")} />
            </FormField>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Permisos</p>
                <p className="text-sm text-muted-foreground">
                  {selected.length} seleccionados de {catalogItems?.length ?? 0}
                </p>
              </div>

              {catalog.isPending ? (
                <div className="space-y-2" aria-hidden>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="shimmer h-16 w-full rounded-xl bg-foreground/6" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map(([module, permissions]) => (
                    <fieldset key={module} className="rounded-xl border border-white/50 p-3 dark:border-white/10">
                      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {moduleLabel(module)}
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {permissions?.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-2">
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={selected.includes(permission.code)}
                              onCheckedChange={(checked) =>
                                toggle(permission.code, checked === true)
                              }
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor={`perm-${permission.id}`}
                              className="text-sm font-normal leading-snug"
                            >
                              {permission.description}
                              <span className="block font-mono text-[11px] text-muted-foreground">
                                {permission.code}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}
            </div>
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
              {isEdit ? "Guardar cambios" : "Crear rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
