/** `WarehouseDTO`. `GET /warehouses` devuelve la lista completa, sin paginar. */
export type Warehouse = {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
