import { create } from "zustand";

/**
 * Estado de UI puro. Sin `persist`: un store persistido en localStorage se
 * rehidrata despues del HTML del servidor y provoca un salto visible en el
 * primer render. Si mas adelante hay que recordar el estado plegado, el sitio
 * correcto es una cookie que lea el layout en servidor.
 */
type UiState = {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));
