import type { ApiErrorBody, ApiFieldError } from "./types";

/**
 * Traduccion de los codigos del backend a mensajes para el usuario.
 * Cualquier codigo desconocido cae en el `message` que envio el backend.
 */
const MESSAGES: Record<string, string> = {
  // Genericos
  VALIDATION_ERROR: "Revisa los datos del formulario.",
  UNAUTHORIZED: "Tu sesion expiro. Vuelve a iniciar sesion.",
  FORBIDDEN: "No tienes permiso para hacer esto.",
  RESOURCE_NOT_FOUND: "No encontramos lo que buscabas.",
  CONFLICT: "La operacion choca con datos que ya existen.",
  BUSINESS_RULE_VIOLATION: "La operacion no cumple una regla del negocio.",
  INTERNAL_ERROR: "Error inesperado del servidor. Intentalo de nuevo.",
  HTTP_ERROR: "No pudimos completar la peticion.",
  // Identidad
  INVALID_CREDENTIALS: "Correo o contrasena incorrectos.",
  INACTIVE_USER: "Esta cuenta esta deshabilitada.",
  EMAIL_ALREADY_REGISTERED: "Ese correo ya esta registrado.",
  USER_NOT_FOUND: "No existe un usuario con ese correo.",
  // Tenant
  COMPANY_REQUIRED: "Selecciona una empresa para continuar.",
  COMPANY_NOT_FOUND: "La empresa no existe.",
  INVALID_COMPANY: "La empresa seleccionada no esta disponible.",
  INVALID_MEMBERSHIP: "No tienes acceso a esta empresa.",
  MEMBERSHIP_ALREADY_EXISTS: "Esa persona ya pertenece a la empresa.",
  INSUFFICIENT_ROLE: "Tu rol no permite esta operacion.",
  // Catalogo
  PRODUCT_NOT_FOUND: "El producto no existe.",
  CATEGORY_NOT_FOUND: "La categoria no existe.",
  DUPLICATE_SKU: "Ya existe un producto con ese SKU.",
  DUPLICATE_BARCODE: "Ya existe un producto con ese codigo de barras.",
  DUPLICATE_CATEGORY_NAME: "Ya existe una categoria con ese nombre.",
  INVALID_PRODUCT_PRICE: "El precio no es valido.",
  // Red (generados en el cliente, no por el backend)
  NETWORK_ERROR: "No pudimos conectar con el servidor.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Mensaje listo para mostrar en un toast o un estado de error. */
  get userMessage(): string {
    return MESSAGES[this.code] ?? this.message ?? MESSAGES.INTERNAL_ERROR;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Errores por campo, con el nombre tal como lo espera React Hook Form.
   * FastAPI devuelve `location: ["body", "sku"]`; aqui queda `sku`.
   */
  get fieldErrors(): Record<string, string> {
    const fields = this.details?.fields;
    if (!Array.isArray(fields)) return {};

    const result: Record<string, string> = {};
    for (const raw of fields as ApiFieldError[]) {
      const path = raw.location?.filter((part) => part !== "body" && part !== "query");
      if (!path?.length) continue;
      result[path.join(".")] = raw.message;
    }
    return result;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Construye un `ApiError` a partir de una respuesta HTTP fallida. */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // El backend responde 204 o HTML (por ejemplo un 502 del proxy).
  }

  const parsed = body as Partial<ApiErrorBody> | null;
  if (parsed?.error?.code) {
    return new ApiError(
      response.status,
      parsed.error.code,
      parsed.error.message,
      parsed.error.details ?? {},
    );
  }

  return new ApiError(response.status, "HTTP_ERROR", response.statusText || "Error HTTP");
}

/** Mensaje seguro para cualquier error, venga de donde venga. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.userMessage;
  if (error instanceof Error) return error.message;
  return MESSAGES.INTERNAL_ERROR;
}
