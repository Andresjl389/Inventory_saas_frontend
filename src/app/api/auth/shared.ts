import { apiEndpoint } from "@/config/env";

type Membership = { company_id: string; is_active: boolean };

/**
 * Si el usuario solo pertenece a una empresa activa, la elegimos por el.
 * Con varias devolvemos `null` y el flujo pasa por /select-company.
 */
export async function resolveInitialCompany(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(apiEndpoint("/companies"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const memberships = (await response.json()) as Membership[];
    const active = memberships.filter((membership) => membership.is_active);
    return active.length === 1 ? active[0].company_id : null;
  } catch {
    return null;
  }
}
