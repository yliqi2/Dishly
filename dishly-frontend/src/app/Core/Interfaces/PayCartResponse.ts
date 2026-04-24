export interface PurchasedItemSummary {
  id_receta: number;
  titulo: string;
  precio_unitario: number;
  imagen_1: string | null;
  updated_at?: string | null;
}

export interface PayCartResponse {
  message: string;
  acquired_count: number;
  invoice_id: number;
  invoice_total: number;
  purchased_items: PurchasedItemSummary[];
}
