import type { Metadata } from "next";

import { SaleCartView } from "@/features/sales/components/sale-cart-view";

export const metadata: Metadata = { title: "Nueva venta" };

export default function NewSalePage() {
  return <SaleCartView />;
}
