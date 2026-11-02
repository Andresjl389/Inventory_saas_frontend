"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import type { RoleCode } from "@/config/permissions";

/**
 * Empresa activa en el cliente.
 *
 * El store se crea por peticion (no a nivel de modulo) porque en Next el mismo
 * proceso de servidor atiende a varios usuarios: un store global filtraria el
 * tenant de uno al render de otro.
 *
 * Este estado solo alimenta la UI y las query keys. La autoridad es la cookie
 * `inv_cid`, que el proxy reenvia como `X-Company-ID` y que el backend
 * revalida contra la membresia en cada peticion. Conocer un UUID aqui no da
 * acceso a nada.
 */
export type TenantState = {
  companyId: string;
  companyName: string;
  roleCode: RoleCode;
  /**
   * Permisos efectivos tal como los manda el servidor. Vacio mientras la API
   * no los incluya; entonces se recurre al mapa local de roles del sistema.
   */
  permissions: readonly string[];
};

type TenantStore = TenantState & {
  setTenant: (tenant: TenantState) => void;
};

type TenantStoreApi = ReturnType<typeof createTenantStore>;

function createTenantStore(initial: TenantState) {
  return createStore<TenantStore>()((set) => ({
    ...initial,
    setTenant: (tenant) => set(tenant),
  }));
}

const TenantStoreContext = createContext<TenantStoreApi | null>(null);

export function TenantStoreProvider({
  value,
  children,
}: {
  value: TenantState;
  children: ReactNode;
}) {
  // `useState` perezoso: crea el store una sola vez por montaje, sin tocar
  // una ref durante el render.
  const [store] = useState(() => createTenantStore(value));
  return <TenantStoreContext.Provider value={store}>{children}</TenantStoreContext.Provider>;
}

export function useTenantStore<T>(selector: (state: TenantStore) => T): T {
  const store = useContext(TenantStoreContext);
  if (!store) {
    throw new Error("useTenantStore debe usarse dentro de <TenantStoreProvider>");
  }
  return useStore(store, selector);
}

/**
 * Atajo para el caso mas comun: la empresa activa completa.
 *
 * `useShallow` es obligatorio: el selector construye un objeto nuevo en cada
 * llamada y `useSyncExternalStore` compara por identidad, asi que sin el la
 * comparacion nunca coincide y el componente se vuelve a renderizar sin fin.
 */
export function useTenant(): TenantState {
  return useTenantStore(
    useShallow((state) => ({
      companyId: state.companyId,
      companyName: state.companyName,
      roleCode: state.roleCode,
      permissions: state.permissions,
    })),
  );
}

export function useCompanyId(): string {
  return useTenantStore((state) => state.companyId);
}
