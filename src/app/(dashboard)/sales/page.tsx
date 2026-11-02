import type { Metadata } from "next";

import { SalesView } from "@/features/sales/components/sales-view";

export const metadata: Metadata = { title: "Ventas" };

export default function SalesPage() {
  return <SalesView />;
}
