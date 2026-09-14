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
import { COMPANY_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/config/permissions";
import { handleFormError } from "@/lib/forms";

import { useAddMember } from "../hooks/use-company-members";
import { addMemberSchema, type AddMemberInput } from "../schemas/company.schema";

export function AddMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addMember = useAddMember();

  const form = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "", role: "SELLER" },
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

  const onSubmit = handleSubmit((values) => {
    addMember.mutate(values, {
      onSuccess: () => {
        reset({ email: "", role: "SELLER" });
        onOpenChange(false);
      },
      onError: (error) => handleFormError(error, setError),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar miembro</DialogTitle>
          <DialogDescription>
            La persona debe tener ya una cuenta. El backend la busca por su correo.
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
              description={ROLE_DESCRIPTIONS[role]}
            >
              <Select
                value={role}
                onValueChange={(value) =>
                  setValue("role", value as AddMemberInput["role"], { shouldDirty: true })
                }
              >
                <SelectTrigger id="member-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ROLE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMember.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addMember.isPending}>
              {addMember.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
