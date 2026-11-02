export const NOTIFICATION_TYPES = [
  "LOW_STOCK",
  "SUBSCRIPTION",
  "REPORT_READY",
  "SYSTEM",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  LOW_STOCK: "Bajo minimo",
  SUBSCRIPTION: "Suscripcion",
  REPORT_READY: "Informe listo",
  SYSTEM: "Sistema",
};

/** A donde lleva cada tipo al pulsarlo. `null` = no navega a ningun sitio. */
export const NOTIFICATION_LINKS: Record<NotificationType, string | null> = {
  LOW_STOCK: "/reports",
  SUBSCRIPTION: "/settings",
  REPORT_READY: "/reports",
  SYSTEM: null,
};

/** `NotificationDTO` */
export type Notification = {
  id: string;
  company_id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  entity_id: string | null;
  created_at: string;
};

/** `NotificationPageDTO`: como la paginacion normal, mas el contador de no leidas. */
export type NotificationPage = {
  items: Notification[];
  total: number;
  unread: number;
  page: number;
  size: number;
  pages: number;
};
