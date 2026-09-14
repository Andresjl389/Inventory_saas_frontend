"use client";

import type { ReactNode } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { SectionPanel } from "@/components/shared/section-panel";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

import { useCurrentCompany } from "../hooks/use-current-company";
import { COMPANY_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "../types/company.types";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/40 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 dark:border-white/6">
      <dt className="w-44 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{value}</dd>
    </div>
  );
}

export function CompanyCard() {
  const company = useCurrentCompany();

  return (
    <div className="space-y-3">
      <SectionPanel title="Empresa">
        {company.isPending ? (
          <div className="space-y-3 p-4" aria-hidden>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="shimmer h-5 w-64 rounded-md bg-foreground/8" />
            ))}
          </div>
        ) : company.error ? (
          <ErrorState error={company.error} onRetry={() => company.refetch()} />
        ) : company.data ? (
          <dl>
            <Row label="Nombre" value={<span className="font-medium">{company.data.name}</span>} />
            <Row label="Razon social" value={company.data.legal_name ?? "-"} />
            <Row
              label="Documento"
              value={
                company.data.document_number
                  ? `${company.data.document_type ? DOCUMENT_TYPE_LABELS[company.data.document_type] : ""} ${company.data.document_number}`.trim()
                  : "-"
              }
            />
            <Row label="Correo" value={company.data.email ?? "-"} />
            <Row label="Telefono" value={company.data.phone ?? "-"} />
            <Row
              label="Estado"
              value={
                <Badge
                  variant="outline"
                  className="border-success/40 font-normal text-success"
                >
                  {COMPANY_STATUS_LABELS[company.data.status]}
                </Badge>
              }
            />
            <Row label="Creada" value={formatDate(company.data.created_at)} />
          </dl>
        ) : null}
      </SectionPanel>

      <p className="px-1 text-xs text-muted-foreground">
        Editar estos datos requiere un endpoint{" "}
        <code className="font-mono">PATCH /companies/current</code> que el backend todavia no
        expone.
      </p>
    </div>
  );
}
