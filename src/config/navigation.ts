import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  ChartNoAxesColumn,
  Factory,
  FileUp,
  HandCoins,
  ScrollText,
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
      { label: "Inventario", href: "/inventory", icon: Boxes, permission: "inventory.read" },
      { label: "Bodegas", href: "/warehouses", icon: Warehouse, permission: "warehouses.read" },
      {
        label: "Movimientos",
        href: "/movements",
        icon: ArrowLeftRight,
        permission: "inventory.read",
      },
    ],
  },
  {
    title: "Comercial",
    items: [
      { label: "Ventas", href: "/sales", icon: ShoppingCart, permission: "sales.read" },
      { label: "Compras", href: "/purchases", icon: Truck, permission: "purchases.read" },
      { label: "Fiado", href: "/credit", icon: HandCoins, permission: "credit.read" },
      { label: "Clientes", href: "/customers", icon: Users, permission: "customers.read" },
      { label: "Proveedores", href: "/suppliers", icon: Factory, permission: "suppliers.read" },
    ],
  },
  {
    title: "Analisis",
    items: [
      {
        label: "Informes",
        href: "/reports",
        icon: ChartNoAxesColumn,
        permission: "reports.read",
      },
      { label: "Auditoria", href: "/audit", icon: ScrollText, permission: "audit.read" },
      { label: "Importar", href: "/imports", icon: FileUp, permission: "imports.read" },
    ],
  },
];

export const secondaryNavigation: NavItem[] = [
  { label: "Ajustes", href: "/settings", icon: Settings },
];
