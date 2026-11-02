import { apiClient } from "@/lib/api/client";

import type { Notification, NotificationPage } from "../types/notification.types";

export const notificationsApi = {
  list: (onlyUnread: boolean, size: number) =>
    apiClient.get<NotificationPage>("/notifications", {
      params: { page: 1, size, only_unread: onlyUnread },
    }),

  markRead: (notificationId: string) =>
    apiClient.post<Notification>(`/notifications/${notificationId}/read`),
};
