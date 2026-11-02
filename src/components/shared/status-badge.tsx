import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

/**
 * Estado activo/inactivo. El color nunca va solo: siempre lleva la palabra,
 * porque un badge distinguible solo por color no se lee sin vision del color.
 */
export function ActiveBadge({
  active,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
  className,
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}) {
  return active ? (
    <Badge
      variant="outline"
      className={cn("border-success/40 font-normal text-success", className)}
    >
      {activeLabel}
    </Badge>
  ) : (
    <Badge variant="secondary" className={cn("font-normal text-muted-foreground", className)}>
      {inactiveLabel}
    </Badge>
  );
}

/** Tonos disponibles para un estado. El texto siempre acompaña al color. */
export type StatusTone = "neutral" | "success" | "danger" | "warning" | "info";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-border text-muted-foreground",
  success: "border-success/40 text-success",
  danger: "border-destructive/40 text-destructive",
  warning: "border-warning/50 text-warning",
  info: "border-primary/40 text-primary",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-normal", TONE_CLASSES[tone], className)}>
      {label}
    </Badge>
  );
}
