import type { Metadata } from "next";

import { CustomersView } from "@/features/customers/components/customers-view";

export const metadata: Metadata = { title: "Clientes" };

export default function CustomersPage() {
  return <CustomersView />;
}
