"use client";

import { Bell, BellDot, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative } from "@/lib/format";
import { cn } from "cn";

import { useMarkNotificationRead, useNotifications } from "../hooks/use-notifications";
import {
  NOTIFICATION_LINKS,
  NOTIFICATION_TYPE_LABELS,
} from "../types/notification.types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications({ size: 15 });
  const markRead = useMarkNotificationRead();

  const unread = notifications.data?.unread ?? 0;
  const items = notifications.data?.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        >
          {unread > 0 ? <BellDot aria-hidden /> : <Bell aria-hidden />}
          {unread > 0 ? (
            /* El numero, no solo el punto: cuantas hay es la informacion util. */
            <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/40 px-3 py-2.5 dark:border-white/6">
          <p className="text-sm font-medium">Notificaciones</p>
          {unread > 0 ? (
            <Badge variant="secondary" className="tnum font-normal">
              {unread} sin leer
            </Badge>
          ) : null}
        </div>

        {notifications.isPending ? (
          <div className="space-y-2 p-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="shimmer h-12 w-full rounded-xl bg-foreground/6" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nada por ahora"
            description="Aqui llegaran los avisos de stock bajo y de la suscripcion."
            className="py-10"
          />
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-white/40 dark:divide-white/6">
              {items.map((item) => {
                const href = NOTIFICATION_LINKS[item.type];
                const content = (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 text-left">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        item.is_read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          item.is_read ? "text-muted-foreground" : "font-medium",
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {NOTIFICATION_TYPE_LABELS[item.type]} - {formatRelative(item.created_at)}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={item.id} className="transition-colors hover:bg-foreground/4">
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => {
                          if (!item.is_read) markRead.mutate(item.id);
                          setOpen(false);
                        }}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="block w-full"
                        onClick={() => {
                          if (!item.is_read) markRead.mutate(item.id);
                        }}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        {unread > 0 ? (
          <div className="border-t border-white/40 p-2 dark:border-white/6">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={markRead.isPending}
              onClick={() => {
                // No hay endpoint para marcarlas todas: se marcan una a una.
                for (const item of items.filter((entry) => !entry.is_read)) {
                  markRead.mutate(item.id);
                }
              }}
            >
              <CheckCheck aria-hidden />
              Marcar todas como leidas
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
