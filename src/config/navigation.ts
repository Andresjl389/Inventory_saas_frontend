import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permiso del backend que habilita la seccion. */
  permission?: string;
  /** Sin endpoint todavia: se muestra apagado en vez de fingir que existe. */
  disabled?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
      { label: "Productos", href: "/products", icon: Package, permission: "products.read" },
      { label: "Categorias", href: "/categories", icon: Tags, permission: "categories.read" },
    ],
  },
  {
    title: "Operacion",
    items: [
      { label: "Inventario", href: "/inventory", icon: Boxes, disabled: true },
      { label: "Bodegas", href: "/warehouses", icon: Warehouse, disabled: true },
      { label: "Movimientos", href: "/movements", icon: ArrowLeftRight, disabled: true },
    ],
  },
  {
    title: "Comercial",
    items: [
      { label: "Ventas", href: "/sales", icon: ShoppingCart, disabled: true },
      { label: "Compras", href: "/purchases", icon: Truck, disabled: true },
      { label: "Clientes", href: "/customers", icon: Users, disabled: true },
    ],
  },
];

export const secondaryNavigation: NavItem[] = [
  { label: "Ajustes", href: "/settings", icon: Settings },
];
