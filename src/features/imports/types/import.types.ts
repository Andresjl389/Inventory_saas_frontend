export const IMPORT_ENTITIES = [
  "CATEGORIES",
  "WAREHOUSES",
  "PRODUCTS",
  "CUSTOMERS",
  "SUPPLIERS",
  "STOCK",
] as const;

export type ImportEntity = (typeof IMPORT_ENTITIES)[number];

export const IMPORT_STATUSES = [
  "ANALYZED",
  "VALIDATED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  ANALYZED: "Analizado",
  VALIDATED: "Validado",
  COMPLETED: "Completado",
  FAILED: "Fallido",
  CANCELLED: "Cancelado",
};

/** Opciones por entidad. El backend las nombra; aqui se explican. */
export const IMPORT_OPTION_LABELS: Record<string, { label: string; help: string }> = {
  create_missing_categories: {
    label: "Crear las categorias que falten",
    help: "Si una fila trae una categoria que no existe, se crea en vez de fallar.",
  },
  replace_existing: {
    label: "Reemplazar las existencias",
    help: "La cantidad del archivo sustituye a la actual en vez de sumarse.",
  },
};

/** `FieldSpecDTO`: un campo de destino al que mapear una columna. */
export type FieldSpec = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  help: string;
  enum_values: string[];
  example: string;
};

/** `EntitySchemaDTO` */
export type EntitySchema = {
  entity: ImportEntity;
  label: string;
  description: string;
  key_field: string;
  options: string[];
  fields: FieldSpec[];
  template_url: string;
};

/**
 * `DetectedColumnDTO`: una columna del archivo del usuario y a que campo cree
 * el backend que corresponde.
 */
export type DetectedColumn = {
  source: string;
  suggested_target: string | null;
  confidence: number;
  reason: string;
  needs_review: boolean;
  samples: string[];
};

/** `PreviewCellDTO`: `raw` es lo que escribio el usuario, `value` como se leyo. */
export type PreviewCell = {
  field_key: string;
  raw: string | null;
  value: string | null;
  error: string | null;
};

export type PreviewRow = {
  row_number: number;
  cells: PreviewCell[];
};

/** `ImportJobDTO` */
export type ImportJob = {
  id: string;
  company_id: string;
  entity: ImportEntity;
  file_id: string;
  filename: string;
  status: ImportStatus;
  mapping: Record<string, string>;
  options: Record<string, unknown>;
  stats: ImportStats;
  failure_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ImportStats = {
  total_rows?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
};

/** `ImportAnalysisDTO`: todo lo que necesita la pantalla de mapeo. */
export type ImportAnalysis = {
  job: ImportJob;
  columns: DetectedColumn[];
  target_fields: FieldSpec[];
  missing_required: string[];
  total_rows: number;
  preview: PreviewRow[];
};

/** `ImportErrorDTO`: `row_number` y `column` son los del archivo del usuario. */
export type ImportRowError = {
  row_number: number;
  column: string | null;
  field_key: string | null;
  value: string | null;
  message: string;
};

/** `ImportResultDTO` */
export type ImportResult = {
  job: ImportJob;
  dry_run: boolean;
  stats: ImportStats;
  errors_preview: ImportRowError[];
};

/** Cuerpo de `PATCH /imports/{id}/mapping`: el mapeo completo, no un parche. */
export type MappingCommand = {
  mapping: Record<string, string>;
  options?: Record<string, boolean>;
  decimal_separator?: string | null;
  date_format?: string | null;
};

/** Centinela del `<select>` para "no importar esta columna". */
export const IGNORE_COLUMN = "__ignore__";

/**
 * Orden recomendado por el backend: un producto necesita su categoria, y el
 * stock necesita producto y bodega. Importar al reves falla fila a fila.
 */
export const ENTITY_ORDER: ImportEntity[] = [
  "CATEGORIES",
  "WAREHOUSES",
  "PRODUCTS",
  "CUSTOMERS",
  "SUPPLIERS",
  "STOCK",
];
