import type { Metadata } from "next";

import { CompanyPicker } from "@/features/companies/components/company-picker";

export const metadata: Metadata = { title: "Elegir empresa" };

export default function SelectCompanyPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <CompanyPicker />
    </main>
  );
}
