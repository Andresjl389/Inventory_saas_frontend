import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { appConfig } from "@/config/env";

/**
 * Pydantic serializa `Decimal` como cadena para no perder precision. No la
 * convertimos a `number` hasta el momento de mostrarla.
 */
export type Money = string | number;

export function toNumber(value: Money | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: Money | null | undefined): string {
  return new Intl.NumberFormat(appConfig.locale, {
    style: "currency",
    currency: appConfig.currency,
    // Fijos, no "hasta 2": con decimales variables las columnas bailan.
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat(appConfig.locale).format(value ?? 0);
}

export function formatPercent(value: number | null | undefined): string {
  return new Intl.NumberFormat(appConfig.locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMM yyyy", { locale: es });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

/**
 * Margen sobre el precio de venta. Devuelve `null` cuando no se puede calcular
 * en vez de un 0 que se leeria como "sin margen".
 */
export function margin(cost: Money, sale: Money): number | null {
  const salePrice = toNumber(sale);
  if (salePrice <= 0) return null;
  return (salePrice - toNumber(cost)) / salePrice;
}
