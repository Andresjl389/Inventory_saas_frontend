import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CompanyPicker } from "@/features/companies/components/company-picker";
import type { Membership } from "@/features/companies/types/company.types";
import { isApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";

import { isPlatformAdmin } from "../(platform)/layout";

export const metadata: Metadata = { title: "Elegir empresa" };

export default async function SelectCompanyPage() {
  /*
   * Quien opera la plataforma no pertenece a ninguna empresa, asi que
   * `GET /companies` le devuelve `[]` y el login lo manda aqui. Pero su sitio
   * es `/admin`, no un selector vacio: "elige una empresa" cuando no hay
   * ninguna que elegir es un callejon sin salida.
   *
   * La sonda solo corre cuando no hay membresias, que es el unico caso en que
   * esta pantalla podria estar equivocada. Un administrador de plataforma que
   * ademas trabaje dentro de una empresa sigue viendo el selector.
   */
  let memberships: Membership[] = [];
  try {
    memberships = await serverApi<Membership[]>("/companies");
  } catch (error) {
    if (isApiError(error) && error.isUnauthorized) redirect("/login");
    // Si falla por otra cosa, que lo cuente el propio selector.
  }

  if (memberships.length === 0 && (await isPlatformAdmin())) redirect("/admin");

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <CompanyPicker />
    </main>
  );
}
