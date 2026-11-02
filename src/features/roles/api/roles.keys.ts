export const roleKeys = {
  all: (companyId: string) => ["roles", companyId] as const,
  list: (companyId: string) => [...roleKeys.all(companyId), "list"] as const,
  /** El catalogo es del sistema, pero se pide con tenant: se cachea por empresa. */
  permissions: (companyId: string) => [...roleKeys.all(companyId), "permissions"] as const,
};
