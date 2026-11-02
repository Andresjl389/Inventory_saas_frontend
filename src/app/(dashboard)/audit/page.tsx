import type { Metadata } from "next";

import { CompanyAuditView } from "@/features/reports/components/company-audit-view";

export const metadata: Metadata = { title: "Auditoria" };

export default function AuditPage() {
  return <CompanyAuditView />;
}
