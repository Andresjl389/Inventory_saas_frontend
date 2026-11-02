"use client";

import { SYSTEM_ROLES, can, systemRolePermissions } from "@/config/permissions";
import { useTenant } from "@/stores/tenant.store";

import { useRoles } from "./use-roles";

function isSystemRole(code: string): code is (typeof SYSTEM_ROLES)[number] {
  return (SYSTEM_ROLES as readonly string[]).includes(code);
}

/**
 * Permisos efectivos del usuario en la empresa activa.
 *
 * La guia de integracion propone cruzar el `role` de `/companies` con el rol
 * correspondiente de `/roles`. Funciona, pero solo para quien pueda leer
 * `/roles`: ese endpoint exige `roles.read`, y ni SELLER ni INVENTORY_MANAGER
 * lo tienen. Pedirlo para todos dejaria a un vendedor con un 403 y, por tanto,
 * sin menu.
 *
 * Asi que se resuelve por el camino mas corto que sea correcto:
 *
 * 1. Si la sesion ya trae los permisos del servidor, mandan esos.
 * 2. Si se puede leer `/roles`, manda lo que diga `/roles`, porque es lo mismo
 *    que aplica el backend. Ojo con el orden: la lista trae primero los del
 *    sistema, y una empresa puede definir un rol propio **con el mismo codigo**
 *    que uno del sistema. Gana el que tiene `company_id`.
 * 3. Si no se puede leer, queda la copia local de los roles del sistema. Son
 *    inmutables en el backend (`SYSTEM_ROLE_IMMUTABLE`), asi que no se
 *    desincroniza; lo unico que no ve es un rol propio que pise ese codigo.
 *    En ese caso el menu puede sobrar o faltar alguna entrada, pero el backend
 *    sigue siendo quien decide y responde con un 403 legible.
 *
 * Los casos 2 y 3 desaparecerian si `MembershipDTO` incluyera `permissions`.
 */
export function useEffectivePermissions(): {
  can: (permission: string) => boolean;
  /** `false` cuando es un rol propio y no se pudo resolver. */
  resolved: boolean;
} {
  const { roleCode, permissions } = useTenant();

  const fromSession = permissions.length > 0;
  const systemRole = isSystemRole(roleCode);

  // Un rol del sistema ya dice si su portador puede leer `/roles`; solo se
  // consulta a quien pueda, para no provocar un 403 seguro.
  const mayReadRoles = systemRole && can("roles.read", { roleCode });
  const lookup = !fromSession && Boolean(roleCode) && (!systemRole || mayReadRoles);

  const roles = useRoles({ enabled: lookup });

  if (fromSession) {
    return { can: (permission) => can(permission, { permissions, roleCode }), resolved: true };
  }

  // El rol propio de la empresa pisa al del sistema con el mismo codigo.
  const matches = roles.data?.filter((role) => role.code === roleCode) ?? [];
  const match = matches.find((role) => role.company_id !== null) ?? matches[0];

  if (match) {
    return {
      can: (permission) => can(permission, { permissions: match.permissions, roleCode }),
      resolved: true,
    };
  }

  if (systemRole) {
    const local = systemRolePermissions(roleCode);
    return { can: (permission) => can(permission, { roleCode }), resolved: local.size > 0 };
  }

  return { can: () => false, resolved: !lookup };
}
