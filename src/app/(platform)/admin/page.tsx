import type { Metadata } from "next";

import { PlatformOverview } from "@/features/platform/components/platform-overview";

export const metadata: Metadata = { title: "Plataforma" };

export default function PlatformPage() {
  return <PlatformOverview />;
}
