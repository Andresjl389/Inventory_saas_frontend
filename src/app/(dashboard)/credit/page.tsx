import type { Metadata } from "next";

import { CreditAccountsView } from "@/features/credit/components/credit-accounts-view";

export const metadata: Metadata = { title: "Fiado" };

export default function CreditPage() {
  return <CreditAccountsView />;
}
