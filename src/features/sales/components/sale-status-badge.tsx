import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";

import { SALE_STATUS_LABELS, type SaleStatus } from "../types/sale.types";

const TONES: Record<SaleStatus, StatusTone> = {
  DRAFT: "neutral",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "warning",
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <StatusBadge label={SALE_STATUS_LABELS[status]} tone={TONES[status]} />;
}
