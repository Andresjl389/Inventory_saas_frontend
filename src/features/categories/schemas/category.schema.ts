import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre de la categoria").max(150),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryFormValues = z.input<typeof categorySchema>;
