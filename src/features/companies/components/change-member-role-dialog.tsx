"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { roleDescription } from "@/config/permissions";
import { RoleSelect } from "@/features/roles/components/role-select";

import { useChangeMemberRole } from "../hooks/use-company-members";
import { memberRole, type CompanyMember } from "../types/company.types";

export function ChangeMemberRoleDialog({
  member,
  onOpenChange,
}: {
  member: CompanyMember | null;
  onOpenChange: (open: boolean) => void;
}) {
  const changeRole = useChangeMemberRole();
  /*
   * El padre remonta este dialogo por miembro (`key`), asi que el valor
   * inicial ya es el correcto y no hace falta sincronizarlo con un efecto.
   */
  const [role, setRole] = useState(() => (member ? memberRole(member) : ""));

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>
            {member?.full_name} pasara a tener los permisos del rol que elijas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="change-role">Rol</Label>
          <RoleSelect id="change-role" className="w-full" value={role} onChange={setRole} />
          <p className="text-xs text-muted-foreground">{roleDescription(role) ?? " "}</p>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changeRole.isPending}
          >
            Cancelar
          </Button>
          <Button
            disabled={changeRole.isPending || !role || role === memberRole(member ?? ({} as CompanyMember))}
            onClick={() => {
              if (!member) return;
              changeRole.mutate(
                { userId: member.user_id, input: { role } },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
          >
            {changeRole.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
