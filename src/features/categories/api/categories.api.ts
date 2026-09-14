import { apiClient } from "@/lib/api/client";

import type { CategoryInput } from "../schemas/category.schema";
import type { Category } from "../types/category.types";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories"),

  create: (input: CategoryInput) => apiClient.post<Category>("/categories", input),

  update: (categoryId: string, input: CategoryInput) =>
    apiClient.patch<Category>(`/categories/${categoryId}`, input),

  /** Borrado real: el backend responde 204. */
  remove: (categoryId: string) => apiClient.delete<void>(`/categories/${categoryId}`),
};
