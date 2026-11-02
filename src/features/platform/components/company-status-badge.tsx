import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import {
  COMPANY_STATUS_LABELS,
  type CompanyStatus,
} from "@/features/companies/types/company.types";

const TONES: Record<CompanyStatus, StatusTone> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  INACTIVE: "neutral",
};

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return <StatusBadge label={COMPANY_STATUS_LABELS[status]} tone={TONES[status]} />;
}
