import type { Metadata } from "next";

import { WarehousesView } from "@/features/warehouses/components/warehouses-view";

export const metadata: Metadata = { title: "Bodegas" };

export default function WarehousesPage() {
  return <WarehousesView />;
}
