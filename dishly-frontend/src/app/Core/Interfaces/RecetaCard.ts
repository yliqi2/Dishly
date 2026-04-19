import { CategoriaReceta } from "./CategoriaReceta";

export interface RecetaCard {
    id_receta: number;
    id_autor: number;
    autor_nombre: string;
    fecha_creacion: string;
    titulo: string;
    descripcion: string;
    tiempo_preparacion: number;
    tiempo_preparacion_unidad: 'minutes' | 'hours';
    dificultad: 'easy' | 'medium' | 'hard';
    porciones: number;
    price: number | null;
    categorias: CategoriaReceta[];
    imagen_1: string | null;
    media_valoraciones: number;
    purchased?: boolean;
}