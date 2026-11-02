import { create } from "zustand";

import type { Partner } from "@/features/partners/types/partner.types";
import type { Product } from "@/features/products/types/product.types";
import { toNumber } from "@/lib/format";

/**
 * Carrito temporal de una venta o una compra (seccion 25 de FRONTEND.md).
 *
 * Es estado de interfaz, no datos del servidor: vive solo hasta que se
 * confirma la operacion. Se guarda a nivel de modulo y no por peticion como el
 * tenant, porque solo lo escriben manejadores de eventos del navegador: en el
 * render del servidor nunca se toca, asi que no hay estado que se filtre entre
 * usuarios. Cambiar de empresa recarga la aplicacion entera, lo que ademas lo
 * vacia.
 */
export type CartItem = {
  product: Product;
  /** Cadenas, no numeros: es exactamente lo que el usuario escribio. */
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

type CartState = {
  items: CartItem[];
  warehouseId: string | null;
  /**
   * Se guarda el socio entero, no solo su id: si el usuario navega a otra
   * pagina y vuelve, el carrito debe poder seguir mostrando su nombre sin
   * tener que volver a pedirlo a la API.
   */
  partner: Partner | null;
  notes: string;

  addItem: (product: Product, unitPrice: string) => void;
  updateItem: (productId: string, patch: Partial<Omit<CartItem, "product">>) => void;
  removeItem: (productId: string) => void;
  setWarehouse: (warehouseId: string | null) => void;
  setPartner: (partner: Partner | null) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
};

const EMPTY = {
  items: [] as CartItem[],
  warehouseId: null,
  partner: null,
  notes: "",
};

export function createCartStore() {
  return create<CartState>((set) => ({
    ...EMPTY,

    addItem: (product, unitPrice) =>
      set((state) => {
        const existing = state.items.find((item) => item.product.id === product.id);
        // Agregar dos veces el mismo producto suma una unidad en vez de
        // crear una linea duplicada que el usuario tendria que juntar.
        if (existing) {
          return {
            items: state.items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: String(toNumber(item.quantity) + 1) }
                : item,
            ),
          };
        }
        return {
          items: [
            ...state.items,
            { product, quantity: "1", unitPrice, discount: "0", tax: "0" },
          ],
        };
      }),

    updateItem: (productId, patch) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.product.id === productId ? { ...item, ...patch } : item,
        ),
      })),

    removeItem: (productId) =>
      set((state) => ({
        items: state.items.filter((item) => item.product.id !== productId),
      })),

    setWarehouse: (warehouseId) => set({ warehouseId }),
    setPartner: (partner) => set({ partner }),
    setNotes: (notes) => set({ notes }),
    clear: () => set(EMPTY),
  }));
}

/** Importe bruto de una linea, antes de descuento e impuesto. */
export function itemGross(item: CartItem): number {
  return toNumber(item.quantity) * toNumber(item.unitPrice);
}

/** Misma formula que `SaleItem.compute_total()` en el backend. */
export function itemTotal(item: CartItem): number {
  return itemGross(item) - toNumber(item.discount) + toNumber(item.tax);
}

/**
 * Totales del carrito.
 *
 * Es una vista previa: la cuenta que vale es la que hace el backend con
 * Decimal. Aqui se usan numeros de JavaScript, suficientes para mostrar, pero
 * nunca se envian: solo viajan cantidades, precios, descuentos e impuestos.
 */
export function cartTotals(items: CartItem[]): CartTotals {
  return items.reduce<CartTotals>(
    (acc, item) => {
      const discount = toNumber(item.discount);
      const tax = toNumber(item.tax);
      return {
        subtotal: acc.subtotal + itemGross(item),
        discount: acc.discount + discount,
        tax: acc.tax + tax,
        total: acc.total + itemTotal(item),
      };
    },
    { subtotal: 0, discount: 0, tax: 0, total: 0 },
  );
}

export const useSaleCart = createCartStore();
export const usePurchaseCart = createCartStore();
