"use client";

import { Lock, Plus, Power, PowerOff, Shield, Users } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Stagger, StaggerItem } from "@/components/shared/motion/reveal";
import { SectionPanel } from "@/components/shared/section-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowActions } from "@/components/shared/row-actions";
import { ActiveBadge } from "@/components/shared/status-badge";
import { roleLabel } from "@/config/permissions";
import { initials } from "@/features/auth/types/auth.types";
import { usePermission, useSession } from "@/providers/session-provider";

import { memberRole, type CompanyMember } from "../types/company.types";
import { useChangeMemberRole, useCompanyMembers } from "../hooks/use-company-members";
import { AddMemberDialog } from "./add-member-dialog";
import { ChangeMemberRoleDialog } from "./change-member-role-dialog";

function MembersSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="shimmer h-10 w-full rounded-xl bg-foreground/6" />
      ))}
    </div>
  );
}

export function MembersCard() {
  const { user } = useSession();
  const canRead = usePermission("members.read");
  const canManage = usePermission("members.manage");
  const members = useCompanyMembers({ enabled: canRead });
  const [addOpen, setAddOpen] = useState(false);
  const [changing, setChanging] = useState<CompanyMember | null>(null);
  const changeRole = useChangeMemberRole();

  if (!canRead) {
    return (
      <SectionPanel title="Equipo">
        <EmptyState
          icon={Lock}
          title="Sin acceso al equipo"
          description="Tu rol no permite ver los miembros de esta empresa."
        />
      </SectionPanel>
    );
  }

  return (
    <>
      <SectionPanel
        title="Equipo"
        action={
          canManage ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus aria-hidden />
              Agregar
            </Button>
          ) : null
        }
      >
        {members.isPending ? (
          <MembersSkeleton />
        ) : members.error ? (
          <ErrorState error={members.error} onRetry={() => members.refetch()} />
        ) : (members.data?.length ?? 0) === 0 ? (
          <EmptyState icon={Users} title="Todavia no hay miembros" />
        ) : (
          <Stagger as="ul" className="divide-y divide-white/40 dark:divide-white/6">
            {members.data?.map((member) => {
              // El backend rechaza que alguien se cambie el rol o se desactive
              // a si mismo (`CANNOT_CHANGE_OWN_ROLE`, `CANNOT_DEMOTE_SELF`,
              // `CANNOT_DEACTIVATE_SELF`). Mejor no ofrecerlo.
              const isSelf = member.user_id === user.id;
              return (
                <StaggerItem
                  key={member.id}
                  as="li"
                  variant="fade"
                  className="flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-foreground/4"
                >
                  <Avatar className="size-9 border border-white/50 dark:border-white/10">
                    <AvatarFallback className="bg-white/60 text-xs font-medium dark:bg-white/6">
                      {initials(member.full_name) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  {isSelf ? (
                    <Badge variant="secondary" className="font-normal">
                      Tu
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="border-white/60 font-normal dark:border-white/12">
                    {roleLabel(memberRole(member))}
                  </Badge>
                  {!member.is_active ? <ActiveBadge active={false} /> : null}

                  <RowActions
                    label={member.full_name}
                    actions={[
                      {
                        label: "Cambiar rol",
                        icon: Shield,
                        hidden: !canManage || isSelf,
                        onSelect: () => setChanging(member),
                      },
                      {
                        label: member.is_active ? "Desactivar" : "Reactivar",
                        icon: member.is_active ? PowerOff : Power,
                        destructive: member.is_active,
                        hidden: !canManage || isSelf,
                        onSelect: () =>
                          changeRole.mutate({
                            userId: member.user_id,
                            input: { role: memberRole(member), is_active: !member.is_active },
                          }),
                      },
                    ]}
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </SectionPanel>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />

      <ChangeMemberRoleDialog
        key={changing?.id ?? "none"}
        member={changing}
        onOpenChange={(open) => {
          if (!open) setChanging(null);
        }}
      />
    </>
  );
}
