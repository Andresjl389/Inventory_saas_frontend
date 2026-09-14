/**
 * Las claves de las consultas con datos del tenant llevan el `companyId`.
 * Sin el, al cambiar de empresa React Query serviria la cache de la anterior.
 * `memberships` es la excepcion: pertenece al usuario, no a una empresa.
 */
export const companyKeys = {
  all: ["companies"] as const,
  memberships: () => [...companyKeys.all, "memberships"] as const,
  detail: (companyId: string) => [...companyKeys.all, companyId] as const,
  members: (companyId: string) => [...companyKeys.all, companyId, "members"] as const,
};
