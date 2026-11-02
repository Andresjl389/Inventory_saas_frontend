import type { Metadata } from "next";

import { AdminPlansView } from "@/features/platform/components/admin-plans-view";

export const metadata: Metadata = { title: "Planes" };

export default function AdminPlansPage() {
  return <AdminPlansView />;
}
