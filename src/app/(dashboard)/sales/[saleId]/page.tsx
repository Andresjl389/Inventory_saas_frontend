import type { Metadata } from "next";

import { SaleDetailView } from "@/features/sales/components/sale-detail-view";

export const metadata: Metadata = { title: "Venta" };

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  return <SaleDetailView saleId={saleId} />;
}
