import type { Metadata } from "next";

import { StockView } from "@/features/inventory/components/stock-view";

export const metadata: Metadata = { title: "Inventario" };

export default function InventoryPage() {
  return <StockView />;
}
