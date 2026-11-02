"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRoles } from "../hooks/use-roles";
import { displayRoleName } from "../types/role.types";

/**
 * Selector de rol. Sale de `GET /roles`, no de una lista fija: asi aparecen
 * tambien los roles que la empresa haya definido por su cuenta.
 */
export function RoleSelect({
  value,
  onChange,
  id,
  className,
  disabled = false,
}: {
  value: string;
  onChange: (roleCode: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}) {
  const roles = useRoles();

  const system = (roles.data ?? []).filter((role) => role.is_system);
  const custom = (roles.data ?? []).filter((role) => !role.is_system);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || roles.isPending}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={roles.isPending ? "Cargando..." : "Elige un rol"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Roles del sistema</SelectLabel>
          {system.map((role) => (
            <SelectItem key={role.id} value={role.code}>
              {displayRoleName(role)}
            </SelectItem>
          ))}
        </SelectGroup>

        {custom.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Roles de la empresa</SelectLabel>
            {custom.map((role) => (
              <SelectItem key={role.id} value={role.code}>
                {role.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  );
}
