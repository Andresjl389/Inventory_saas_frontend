"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { Reveal } from "@/components/shared/motion/reveal";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditTable } from "@/features/audit/components/audit-table";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  type AuditAction,
} from "@/features/audit/types/audit.types";
import {
  DEFAULT_AUDIT_FILTERS,
  type AuditFilters,
} from "@/features/platform/types/platform.types";

import { useCompanyAudit } from "../hooks/use-reports";

const ALL = "all";

export function CompanyAuditView() {
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_AUDIT_FILTERS);
  const audit = useCompanyAudit(filters);

  const updateFilters = (patch: Partial<AuditFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  return (
    <>
      <Reveal as="header">
        <PageHeader
          title="Auditoria"
          description="Lo que ha pasado en esta empresa: quien hizo que y cuando."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <DataTableToolbar>
          <Select
            value={filters.action ?? ALL}
            onValueChange={(value) =>
              updateFilters({ action: value === ALL ? null : (value as AuditAction) })
            }
          >
            <SelectTrigger className="w-full sm:w-64" aria-label="Filtrar por accion">
              <SelectValue placeholder="Accion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las acciones</SelectItem>
              {AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filters.action ? (
            <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_AUDIT_FILTERS)}>
              <X aria-hidden />
              Limpiar
            </Button>
          ) : null}
        </DataTableToolbar>
      </Reveal>

      <Reveal delay={0.14}>
        <AuditTable
          page={audit.data}
          isLoading={audit.isPending}
          isFetching={audit.isFetching && !audit.isPending}
          error={audit.error}
          onRetry={() => audit.refetch()}
          hasFilters={Boolean(filters.action)}
          onClearFilters={() => setFilters(DEFAULT_AUDIT_FILTERS)}
          onPageChange={(next) => updateFilters({ page: next })}
          onSizeChange={(size) => updateFilters({ size })}
        />
      </Reveal>
    </>
  );
}
