export const categoryKeys = {
  all: (companyId: string) => ["categories", companyId] as const,
  list: (companyId: string) => [...categoryKeys.all(companyId), "list"] as const,
};
