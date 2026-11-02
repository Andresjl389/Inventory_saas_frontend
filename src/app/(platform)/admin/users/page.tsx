import type { Metadata } from "next";

import { AdminUsersView } from "@/features/platform/components/admin-users-view";

export const metadata: Metadata = { title: "Usuarios" };

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
