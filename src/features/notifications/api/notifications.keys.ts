export const notificationKeys = {
  all: (companyId: string) => ["notifications", companyId] as const,
  list: (companyId: string, onlyUnread: boolean, size: number) =>
    [...notificationKeys.all(companyId), "list", onlyUnread, size] as const,
};
