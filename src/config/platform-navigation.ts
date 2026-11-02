import {
  Building2,
  CreditCard,
  LayoutDashboard,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PlatformNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Navegacion del area de plataforma. No lleva permisos por item: entrar aqui
 * ya exige ser administrador de plataforma, y eso lo decide el backend por
 * `users.is_superuser`.
 */
export const platformNavigation: PlatformNavItem[] = [
  { label: "Resumen", href: "/admin", icon: LayoutDashboard },
  { label: "Empresas", href: "/admin/companies", icon: Building2 },
  { label: "Usuarios", href: "/admin/users", icon: Users },
  { label: "Planes", href: "/admin/plans", icon: CreditCard },
  { label: "Auditoria", href: "/admin/audit", icon: ScrollText },
];
