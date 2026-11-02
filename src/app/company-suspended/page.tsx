import type { Metadata } from "next";

import { CompanyBlocked } from "@/features/companies/components/company-blocked";

export const metadata: Metadata = { title: "Empresa suspendida" };

export default function CompanySuspendedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <CompanyBlocked />
    </main>
  );
}
