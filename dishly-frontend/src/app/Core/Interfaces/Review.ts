export interface Review {
  id_valoracion: number;
  id_receta: number;
  id_usuario: number;
  puntuacion: number;
  comentario: string;
  fecha: string;
  autor_nombre: string;
}
