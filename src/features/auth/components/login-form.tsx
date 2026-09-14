"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { handleFormError } from "@/lib/forms";

import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginInput } from "../schemas/auth.schema";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;
  const login = useLogin(next);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onError: (error) => handleFormError(error, setError),
    });
  });

  // `isPending` sigue activo tras el exito porque la navegacion es una recarga.
  const busy = login.isPending || login.isSuccess;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        <FormField id="email" label="Correo" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(errors.email)}
            placeholder="tu@empresa.com"
            {...register("email")}
          />
        </FormField>

        <FormField id="password" label="Contrasena" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </FormField>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Entrar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Crear una empresa
        </Link>
      </p>
    </form>
  );
}
