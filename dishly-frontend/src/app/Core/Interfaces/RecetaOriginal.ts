import { CategoriaReceta } from "./CategoriaReceta";
import { IngredienteReceta } from "./IngredienteReceta";




export interface RecetaOriginal {
    active?: number;
    purchased?: boolean;
    id_receta: number;
    id_autor: number;
    autor_nombre: string;
    autor_icon_path?: string | null;
    autor_updated_at?: string | null;
    fecha_creacion: string;
    titulo: string;
    descripcion: string;
    instrucciones: string;
    tiempo_preparacion: number;
    tiempo_preparacion_unidad: 'minutes' | 'hours';
    dificultad: 'easy' | 'medium' | 'hard';
    porciones: number;
    price: number | null; // El backend procesa el precio como numero válido o null si viene vacío
    categorias: CategoriaReceta[]; // Trae el id de receta, de categoria y nombre
    ingredientes: IngredienteReceta[]; // Trae detalle del ingrediente: id, nombre, cantidad y unidad
    imagen_1: string | null;
    imagen_2: string | null;
    imagen_3: string | null;
    imagen_4: string | null;
    imagen_5: string | null;
    media_valoraciones: number;
}