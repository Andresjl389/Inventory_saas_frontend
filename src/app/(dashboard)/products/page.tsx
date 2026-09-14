import type { Metadata } from "next";

import { ProductsView } from "@/features/products/components/products-view";

export const metadata: Metadata = { title: "Productos" };

export default function ProductsPage() {
  return <ProductsView />;
}
