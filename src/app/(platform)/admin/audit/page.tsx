import type { Metadata } from "next";

import { AdminAuditView } from "@/features/platform/components/admin-audit-view";

export const metadata: Metadata = { title: "Auditoria" };

export default function AdminAuditPage() {
  return <AdminAuditView />;
}
