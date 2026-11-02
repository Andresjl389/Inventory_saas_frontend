import type { Metadata } from "next";

import { AdminCompanyDetail } from "@/features/platform/components/admin-company-detail";

export const metadata: Metadata = { title: "Empresa" };

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <AdminCompanyDetail companyId={companyId} />;
}
