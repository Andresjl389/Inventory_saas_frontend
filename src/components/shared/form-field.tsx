import type { ReactNode } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

/**
 * Envoltorio de un control de formulario: etiqueta asociada, descripcion y
 * error con `role="alert"`. Centralizarlo evita que se pierda la accesibilidad
 * formulario a formulario.
 */
export function FormField({
  id,
  label,
  error,
  description,
  required = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  );
}
