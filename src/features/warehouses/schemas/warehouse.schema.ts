import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre de la bodega").max(150),
  address: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type WarehouseFormValues = z.input<typeof warehouseSchema>;
