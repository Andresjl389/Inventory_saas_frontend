import type { Metadata } from "next";

import { AdminCompaniesView } from "@/features/platform/components/admin-companies-view";

export const metadata: Metadata = { title: "Empresas" };

export default function AdminCompaniesPage() {
  return <AdminCompaniesView />;
}
