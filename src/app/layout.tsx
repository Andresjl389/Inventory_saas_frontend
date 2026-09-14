import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { appConfig } from "@/config/env";
import { AppProvider } from "@/providers/app-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${appConfig.name} | ${appConfig.fullName}`,
    template: `%s | ${appConfig.name}`,
  },
  description: "Gestion de inventario multi-empresa.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      // next-themes escribe la clase del tema antes de la hidratacion.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full" cz-shortcut-listen="true">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
