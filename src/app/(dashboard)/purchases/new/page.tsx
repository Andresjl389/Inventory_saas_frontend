import type { Metadata } from "next";

import { PurchaseCartView } from "@/features/purchases/components/purchase-cart-view";

export const metadata: Metadata = { title: "Nueva compra" };

export default function NewPurchasePage() {
  return <PurchaseCartView />;
}
