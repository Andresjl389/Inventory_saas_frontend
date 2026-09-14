"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation, secondaryNavigation } from "@/config/navigation";

const LABELS = new Map(
  [...navigation.flatMap((section) => section.items), ...secondaryNavigation].map((item) => [
    item.href,
    item.label,
  ]),
);

/** Miga de pan derivada de la ruta. Los segmentos que son UUID no se muestran. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment);
    return {
      href,
      label: LABELS.get(href) ?? (isId ? "Detalle" : segment),
      isLast: index === segments.length - 1,
    };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Ruta" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1">
            {crumb.isLast ? (
              <span className="truncate font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
