/** `CategoryDTO`. El backend devuelve la lista completa, sin paginar. */
export type Category = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};
