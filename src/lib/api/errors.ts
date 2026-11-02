import { formatMoney } from "@/lib/format";

import type { ApiErrorBody, ApiFieldError } from "./types";

/** "8.0000" -> "8": los ceros de la escala Decimal no aportan al leerlo. */
function trimNumber(value: number): string {
  return String(Number(value.toFixed(4)));
}

/** Nombres legibles de los tipos que admite el backend. */
const FILE_TYPE_NAMES: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "image/gif": "GIF",
  "application/pdf": "PDF",
  "text/csv": "CSV",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};

/** `products.create` -> "Crear productos", cuando se conoce; si no, el codigo. */
const PERMISSION_LABELS: Record<string, string> = {
  "categories.write": "Gestionar categorias",
  "products.create": "Crear productos",
  "products.update": "Editar productos",
  "products.delete": "Desactivar productos",
  "warehouses.write": "Gestionar bodegas",
  "inventory.adjust": "Ajustar inventario",
  "inventory.transfer": "Trasladar inventario",
  "customers.write": "Gestionar clientes",
  "suppliers.write": "Gestionar proveedores",
  "sales.create": "Crear ventas",
  "sales.cancel": "Cancelar ventas",
  "credit.read": "Ver saldos de fiado",
  "credit.manage": "Registrar abonos y ajustar cuentas",
  "purchases.create": "Crear compras",
  "purchases.cancel": "Cancelar compras",
  "members.manage": "Gestionar miembros",
  "roles.manage": "Gestionar roles",
  "reports.read": "Ver informes",
  "audit.read": "Ver auditoria",
  "files.write": "Subir archivos",
  "imports.run": "Ejecutar importaciones",
};

function permissionLabel(code: string): string {
  const label = PERMISSION_LABELS[code];
  return label ? `"${label}"` : `\`${code}\``;
}

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
  TOKEN_EXPIRED: "Tu sesion expiro. Vuelve a iniciar sesion.",
  INVALID_TOKEN: "Tu sesion no es valida. Vuelve a iniciar sesion.",
  INACTIVE_USER: "Esta cuenta esta deshabilitada.",
  EMAIL_ALREADY_REGISTERED: "Ese correo ya esta registrado.",
  USER_NOT_FOUND: "No existe un usuario con ese correo.",
  // Tenant
  COMPANY_REQUIRED: "Selecciona una empresa para continuar.",
  COMPANY_NOT_FOUND: "La empresa no existe.",
  INVALID_COMPANY: "La empresa seleccionada no esta disponible.",
  INVALID_MEMBERSHIP: "No tienes acceso a esta empresa.",
  MEMBERSHIP_ALREADY_EXISTS: "Esa persona ya pertenece a la empresa.",
  ACCOUNT_DETAILS_REQUIRED:
    "Ese correo no tiene cuenta. Completa nombre, apellido y contrasena para crearla.",
  CANNOT_DEMOTE_SELF: "No puedes quitarte permisos a ti mismo.",
  CANNOT_DEACTIVATE_SELF: "No puedes desactivar tu propia cuenta.",
  INSUFFICIENT_ROLE: "Tu rol no permite esta operacion.",
  NOT_PLATFORM_ADMIN: "Esta zona es solo para quien administra la plataforma.",
  // Catalogo
  PRODUCT_NOT_FOUND: "El producto no existe.",
  CATEGORY_NOT_FOUND: "La categoria no existe.",
  DUPLICATE_SKU: "Ya existe un producto con ese SKU.",
  DUPLICATE_BARCODE: "Ya existe un producto con ese codigo de barras.",
  DUPLICATE_CATEGORY_NAME: "Ya existe una categoria con ese nombre.",
  INVALID_PRODUCT_PRICE: "El precio no es valido.",
  INACTIVE_PRODUCT: "Ese producto esta inactivo.",
  // Bodegas e inventario
  WAREHOUSE_NOT_FOUND: "La bodega no existe.",
  DUPLICATE_WAREHOUSE_NAME: "Ya existe una bodega con ese nombre.",
  INACTIVE_WAREHOUSE: "Esa bodega esta inactiva.",
  INSUFFICIENT_STOCK: "No hay stock suficiente para esta operacion.",
  INVALID_STOCK_MOVEMENT: "El movimiento de stock no es valido.",
  SAME_WAREHOUSE_TRANSFER: "El origen y el destino deben ser bodegas distintas.",
  // Clientes y proveedores
  CUSTOMER_NOT_FOUND: "El cliente no existe.",
  DUPLICATE_CUSTOMER_DOCUMENT: "Ya existe un cliente con ese documento.",
  INACTIVE_CUSTOMER: "Ese cliente esta inactivo.",
  SUPPLIER_NOT_FOUND: "El proveedor no existe.",
  DUPLICATE_SUPPLIER_DOCUMENT: "Ya existe un proveedor con ese documento.",
  INACTIVE_SUPPLIER: "Ese proveedor esta inactivo.",
  // Ventas
  SALE_NOT_FOUND: "La venta no existe.",
  EMPTY_SALE: "Agrega al menos un producto a la venta.",
  INVALID_SALE_TRANSITION: "La venta no puede pasar a ese estado.",
  INVALID_SALE_ITEM: "Hay una linea de la venta con datos invalidos.",
  // Fiado
  CREDIT_SALE_NEEDS_CUSTOMER: "Para fiar hay que elegir un cliente: no se le fia a nadie.",
  OVERPAID_SALE: "Lo pagado no puede superar el total de la venta.",
  CREDIT_LIMIT_EXCEEDED: "Esta venta supera el cupo de fiado del cliente.",
  INVALID_PAYMENT: "El abono debe ser mayor que cero.",
  PAYMENT_EXCEEDS_BALANCE: "El abono es mayor que lo que debe el cliente.",
  ACCOUNT_NOT_FOUND: "Ese cliente no tiene cuenta de fiado.",
  INVALID_ACCOUNT_ENTRY: "Ese movimiento de cuenta no es valido.",
  // Compras
  PURCHASE_NOT_FOUND: "La compra no existe.",
  EMPTY_PURCHASE: "Agrega al menos un producto a la compra.",
  INVALID_PURCHASE_TRANSITION: "La compra no puede pasar a ese estado.",
  INVALID_PURCHASE_ITEM: "Hay una linea de la compra con datos invalidos.",
  // Roles
  SYSTEM_ROLE_IMMUTABLE: "Los roles del sistema no se pueden modificar.",
  DUPLICATE_ROLE_CODE: "Ya existe un rol con ese codigo.",
  ROLE_IN_USE: "No puedes eliminar un rol que alguien tiene asignado.",
  UNKNOWN_PERMISSION: "Ese permiso no existe en el catalogo.",
  CANNOT_GRANT_WILDCARD: "El acceso total solo lo tiene el propietario.",
  CANNOT_CHANGE_OWN_ROLE: "No puedes cambiarte el rol a ti mismo.",
  ROLE_NOT_FOUND: "Ese rol no existe en esta empresa.",
  OWNER_PASSWORD_REQUIRED: "Esa cuenta no existe: define una contrasena inicial.",
  // Archivos
  FILE_TOO_LARGE: "El archivo supera el limite de 10 MB.",
  UNSUPPORTED_FILE_TYPE: "Ese tipo de archivo no se admite.",
  EMPTY_FILE: "El archivo esta vacio.",
  OWNER_ID_REQUIRED: "Falta indicar a que pertenece el archivo.",
  // Importacion
  MISSING_REQUIRED_COLUMNS: "Faltan columnas obligatorias por asignar.",
  UNKNOWN_TARGET_FIELD: "Ese campo de destino no existe.",
  IMPORT_NOT_OPEN: "Esta importacion ya termino. Vuelve a subir el archivo.",
  UNREADABLE_FILE: "No pudimos leer el archivo. Revisa que sea un Excel o CSV valido.",
  NO_HEADER_ROW: "El archivo no tiene fila de encabezados.",
  IMPORT_TOO_LARGE: "El archivo supera las 20.000 filas.",
  // Red y protocolo (generados en el cliente, no por el backend)
  NETWORK_ERROR: "No pudimos conectar con el servidor.",
  METHOD_NOT_ALLOWED: "Esa operacion ya no existe en el servidor.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  /**
   * `X-Request-ID` de la respuesta. El mismo identificador queda en los logs
   * del backend, asi que mostrarlo convierte "me dio error" en algo que se
   * puede buscar.
   */
  readonly requestId: string | null;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {},
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  /**
   * Mensaje listo para mostrar.
   *
   * Algunos errores traen datos en `details` que convierten un "error" en algo
   * accionable: cuanto stock queda de verdad, o que permiso falta. Cuando
   * estan, se usan.
   */
  get userMessage(): string {
    const detailed = this.detailedMessage();
    if (detailed) return detailed;
    return MESSAGES[this.code] ?? this.message ?? MESSAGES.INTERNAL_ERROR;
  }

  private detailedMessage(): string | null {
    const details = this.details ?? {};

    if (this.code === "INSUFFICIENT_STOCK") {
      const available = details.available;
      const requested = details.requested;
      if (available !== undefined && requested !== undefined) {
        const has = Number(available);
        const wants = Number(requested);
        if (Number.isFinite(has) && Number.isFinite(wants)) {
          return `Solo quedan ${trimNumber(has)} unidades y se pidieron ${trimNumber(wants)}.`;
        }
      }
    }

    if (this.code === "UNSUPPORTED_FILE_TYPE") {
      const allowed = details.allowed;
      if (Array.isArray(allowed) && allowed.length > 0) {
        const extensions = allowed
          .map((type) => FILE_TYPE_NAMES[String(type)])
          .filter(Boolean);
        if (extensions.length > 0) {
          return `Ese tipo de archivo no se admite. Acepta ${[...new Set(extensions)].join(", ")}.`;
        }
      }
    }

    if (this.code === "CREDIT_LIMIT_EXCEEDED") {
      const balance = Number(details.balance);
      const limit = Number(details.credit_limit);
      if (Number.isFinite(balance) && Number.isFinite(limit)) {
        return `Supera el cupo de fiado: debe ${formatMoney(balance)} de un cupo de ${formatMoney(limit)}.`;
      }
    }

    if (this.code === "PAYMENT_EXCEEDS_BALANCE") {
      const balance = Number(details.balance);
      if (Number.isFinite(balance)) {
        return `Es mas de lo que debe: el saldo es ${formatMoney(balance)}.`;
      }
    }

    if (this.code === "INSUFFICIENT_ROLE") {
      const permission = details.required_permission;
      if (typeof permission === "string") {
        return `Te falta el permiso ${permissionLabel(permission)}.`;
      }
    }

    return null;
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

  const requestId = response.headers.get("x-request-id");
  const parsed = body as Partial<ApiErrorBody> | null;
  if (parsed?.error?.code) {
    return new ApiError(
      response.status,
      // Un 405 llega con el codigo generico `HTTP_ERROR`, y su mensaje ("No
      // pudimos completar la peticion") no dice nada. Es una ruta que el
      // backend retiro, como la creacion de empresas.
      response.status === 405 ? "METHOD_NOT_ALLOWED" : parsed.error.code,
      parsed.error.message,
      parsed.error.details ?? {},
      requestId,
    );
  }

  return new ApiError(
    response.status,
    response.status === 405 ? "METHOD_NOT_ALLOWED" : "HTTP_ERROR",
    response.statusText || "Error HTTP",
    {},
    requestId,
  );
}

/** Mensaje seguro para cualquier error, venga de donde venga. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.userMessage;
  if (error instanceof Error) return error.message;
  return MESSAGES.INTERNAL_ERROR;
}
