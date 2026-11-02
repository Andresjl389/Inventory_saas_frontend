import type { Metadata } from "next";

import { PurchasesView } from "@/features/purchases/components/purchases-view";

export const metadata: Metadata = { title: "Compras" };

export default function PurchasesPage() {
  return <PurchasesView />;
}
