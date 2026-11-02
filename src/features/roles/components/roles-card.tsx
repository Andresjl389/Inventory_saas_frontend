"use client";

import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { RowActions } from "@/components/shared/row-actions";
import { SectionPanel } from "@/components/shared/section-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WILDCARD } from "@/config/permissions";
import { usePermission } from "@/providers/session-provider";

import { useDeleteRole } from "../hooks/use-role-mutations";
import { useRoles } from "../hooks/use-roles";
import { displayRoleName, type Role } from "../types/role.types";
import { RoleFormDialog } from "./role-form-dialog";

export function RolesCard() {
  const canRead = usePermission("roles.read");
  const canManage = usePermission("roles.manage");
  const roles = useRoles({ enabled: canRead });
  const deleteRole = useDeleteRole();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

  if (!canRead) return null;

  return (
    <>
      <SectionPanel
        title="Roles"
        action={
          canManage ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden />
              Nuevo rol
            </Button>
          ) : null
        }
      >
        {roles.isPending ? (
          <div className="space-y-3 p-4" aria-hidden>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="shimmer h-10 w-full rounded-xl bg-foreground/6" />
            ))}
          </div>
        ) : roles.error ? (
          <ErrorState error={roles.error} onRetry={() => roles.refetch()} />
        ) : (roles.data?.length ?? 0) === 0 ? (
          <EmptyState icon={Shield} title="Sin roles" />
        ) : (
          <Stagger as="ul" className="divide-y divide-white/40 dark:divide-white/6">
            {roles.data?.map((role) => {
              const isWildcard = role.permissions.includes(WILDCARD);
              return (
                <StaggerItem
                  key={role.id}
                  as="li"
                  variant="fade"
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-foreground/4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayRoleName(role)}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {role.code}
                    </p>
                  </div>

                  <Badge variant="secondary" className="tnum shrink-0 font-normal">
                    {isWildcard ? "Todos" : `${role.permissions.length} permisos`}
                  </Badge>

                  {role.is_system ? (
                    <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">
                      Sistema
                    </Badge>
                  ) : null}

                  {/* Los roles del sistema los comparten todas las empresas: no se editan aqui. */}
                  <RowActions
                    label={displayRoleName(role)}
                    actions={[
                      {
                        label: "Editar",
                        icon: Pencil,
                        hidden: !canManage || role.is_system,
                        onSelect: () => {
                          setEditing(role);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: "Eliminar",
                        icon: Trash2,
                        destructive: true,
                        hidden: !canManage || role.is_system,
                        onSelect: () => setPendingDelete(role),
                      },
                    ]}
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </SectionPanel>

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        destructive
        loading={deleteRole.isPending}
        title={`Eliminar ${pendingDelete ? displayRoleName(pendingDelete) : ""}?`}
        description="Solo se puede eliminar si ningun miembro lo tiene asignado. Reasignalos antes si hace falta."
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteRole.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </>
  );
}
