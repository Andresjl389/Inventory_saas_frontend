/** Forma exacta del error que devuelve el backend (middleware/error_handler.py). */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

/** `details.fields` cuando el codigo es VALIDATION_ERROR. */
export type ApiFieldError = {
  location: (string | number)[];
  message: string;
  type: string;
};

/** Equivalente a `ProductPageDTO` y a cualquier pagina futura del backend. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;
