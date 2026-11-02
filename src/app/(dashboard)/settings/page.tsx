import type { Metadata } from "next";

import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { CompanyCard } from "@/features/companies/components/company-card";
import { MembersCard } from "@/features/companies/components/members-card";
import { RolesCard } from "@/features/roles/components/roles-card";

export const metadata: Metadata = { title: "Ajustes" };

export default function SettingsPage() {
  return (
    <>
      <Reveal as="header">
        <PageHeader title="Ajustes" description="Datos de la empresa activa y personas con acceso." />
      </Reveal>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Reveal delay={0.08}>
          <CompanyCard />
        </Reveal>
        <Reveal delay={0.14}>
          <MembersCard />
        </Reveal>
        <Reveal delay={0.2} className="lg:col-span-2">
          <RolesCard />
        </Reveal>
      </div>
    </>
  );
}
