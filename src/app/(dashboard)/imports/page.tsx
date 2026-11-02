import type { Metadata } from "next";

import { ImportsView } from "@/features/imports/components/imports-view";

export const metadata: Metadata = { title: "Importar" };

export default function ImportsPage() {
  return <ImportsView />;
}
