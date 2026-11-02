import type { Metadata } from "next";

import { CustomerAccountView } from "@/features/credit/components/customer-account-view";

export const metadata: Metadata = { title: "Cuenta de fiado" };

export default async function CustomerAccountPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CustomerAccountView customerId={customerId} />;
}
