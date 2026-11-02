"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { handleFormError } from "@/lib/forms";

import { useRegister } from "../hooks/use-register";
import { registerSchema, type RegisterInput } from "../schemas/auth.schema";

export function RegisterForm() {
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(values, {
      onError: (error) => handleFormError(error, setError),
    });
  });

  const busy = registerUser.isPending || registerUser.isSuccess;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="first_name" label="Nombre" required error={errors.first_name?.message}>
            <Input
              id="first_name"
              autoComplete="given-name"
              autoFocus
              aria-invalid={Boolean(errors.first_name)}
              {...register("first_name")}
            />
          </FormField>

          <FormField id="last_name" label="Apellido" required error={errors.last_name?.message}>
            <Input
              id="last_name"
              autoComplete="family-name"
              aria-invalid={Boolean(errors.last_name)}
              {...register("last_name")}
            />
          </FormField>
        </div>

        <FormField id="email" label="Correo" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="password"
            label="Contrasena"
            required
            error={errors.password?.message}
            description="Minimo 8 caracteres."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </FormField>

          <FormField
            id="confirmPassword"
            label="Repetir contrasena"
            required
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
          </FormField>
        </div>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
