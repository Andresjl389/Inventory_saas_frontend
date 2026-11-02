export const warehouseKeys = {
  all: (companyId: string) => ["warehouses", companyId] as const,
  list: (companyId: string, isActive?: boolean) =>
    [...warehouseKeys.all(companyId), "list", isActive ?? "todas"] as const,
  detail: (companyId: string, warehouseId: string) =>
    [...warehouseKeys.all(companyId), "detail", warehouseId] as const,
};
