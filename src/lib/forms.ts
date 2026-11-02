import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { errorMessage, isApiError } from "@/lib/api/errors";

/**
 * Errores de negocio que el backend devuelve como 409/404 sin decir a que
 * campo pertenecen. Mostrarlos junto al input correcto ahorra al usuario
 * adivinar que hay que corregir.
 */
const CODE_TO_FIELD: Record<string, string> = {
  DUPLICATE_SKU: "sku",
  DUPLICATE_BARCODE: "barcode",
  DUPLICATE_CATEGORY_NAME: "name",
  EMAIL_ALREADY_REGISTERED: "email",
  USER_NOT_FOUND: "email",
  MEMBERSHIP_ALREADY_EXISTS: "email",
  ROLE_NOT_FOUND: "role",
  INVALID_CREDENTIALS: "password",
};

/**
 * Vuelca los errores de la API sobre el formulario. Devuelve `true` si al
 * menos uno se pudo asociar a un campo; si no, el llamante muestra un toast.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  extraMap: Record<string, string> = {},
): boolean {
  if (!isApiError(error)) return false;

  const fieldErrors = error.fieldErrors;
  const names = Object.keys(fieldErrors);
  if (names.length > 0) {
    for (const name of names) {
      setError(name as Path<T>, { type: "server", message: fieldErrors[name] });
    }
    return true;
  }

  const target = extraMap[error.code] ?? CODE_TO_FIELD[error.code];
  if (target) {
    setError(target as Path<T>, { type: "server", message: error.userMessage });
    return true;
  }

  return false;
}

/** Atajo para el `onError` de una mutacion de formulario. */
export function handleFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  extraMap?: Record<string, string>,
): void {
  if (!applyApiFieldErrors(error, setError, extraMap)) {
    toast.error(errorMessage(error));
  }
}
