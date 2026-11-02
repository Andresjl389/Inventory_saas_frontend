"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCompanyId } from "@/stores/tenant.store";

import { notificationsApi } from "../api/notifications.api";
import { notificationKeys } from "../api/notifications.keys";

/**
 * Notificaciones de la empresa.
 *
 * No hay websockets ni SSE en el backend, asi que se consulta cada 60 s y
 * tambien al volver a la pestana. Las alertas de stock bajo las genera un
 * trabajo diario, de modo que tampoco llegarian en tiempo real.
 */
export function useNotifications({
  onlyUnread = false,
  size = 20,
}: { onlyUnread?: boolean; size?: number } = {}) {
  const companyId = useCompanyId();

  return useQuery({
    queryKey: notificationKeys.list(companyId, onlyUnread, size),
    queryFn: () => notificationsApi.list(onlyUnread, size),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all(companyId) }),
  });
}
