import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";

import { PURCHASE_STATUS_LABELS, type PurchaseStatus } from "../types/purchase.types";

const TONES: Record<PurchaseStatus, StatusTone> = {
  DRAFT: "neutral",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <StatusBadge label={PURCHASE_STATUS_LABELS[status]} tone={TONES[status]} />;
}
