export interface CartApiItem {
  id_receta: number;
  titulo?: string;
  descripcion?: string | null;
  autor_nombre?: string | null;
  precio_unitario?: number | string | null;
  price?: number | string | null;
  imagen_1?: string | null;
  imagen_2?: string | null;
  imagen_3?: string | null;
  imagen_4?: string | null;
  imagen_5?: string | null;
}

export interface CartResponse {
  id_carrito: number | null;
  fecha_creacion: string | null;
  items: CartApiItem[];
  total: number;
}
