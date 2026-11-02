/**
 * Tipos de documento. El backend los movio a `domain/shared/document.py`
 * porque los comparten empresas, clientes y proveedores; aqui viven en el
 * mismo sitio por la misma razon.
 */
export const DOCUMENT_TYPES = ["NIT", "CC", "CE", "PASSPORT", "RUT", "OTHER"] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  NIT: "NIT",
  CC: "Cedula de ciudadania",
  CE: "Cedula de extranjeria",
  PASSPORT: "Pasaporte",
  RUT: "RUT",
  OTHER: "Otro",
};

/** Version corta para tablas, donde no cabe el nombre completo. */
export const DOCUMENT_TYPE_SHORT: Record<DocumentType, string> = {
  NIT: "NIT",
  CC: "CC",
  CE: "CE",
  PASSPORT: "Pasaporte",
  RUT: "RUT",
  OTHER: "Otro",
};

export function formatDocument(
  type: DocumentType | null | undefined,
  numberValue: string | null | undefined,
): string {
  if (!numberValue) return "-";
  return type ? `${DOCUMENT_TYPE_SHORT[type]} ${numberValue}` : numberValue;
}
