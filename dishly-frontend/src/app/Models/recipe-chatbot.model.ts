// recipe-chatbot.model.ts

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  receta?: RecetaData | null;
  isTyping?: boolean;
}

export interface RecetaResponse {
  status: string;
  receta: RecetaData;
  message?: string;
}

export interface RecetaData {
  id_receta: number;
  titulo: string;
  descripcion: string;
  instrucciones: string;
  tiempo_preparacion: number;
  tiempo_preparacion_unidad: 'minutes' | 'hours';
  tiempo_texto: string;
  dificultad: 'easy' | 'medium' | 'hard';
  dificultad_texto: string;
  porciones: number;
  ingredientes: IngredienteResponse[];
  imagenes: string[];
  imagen_principal: string | null;
  mensaje_chat: string;
}

export interface IngredienteResponse {
  nombre: string;
  cantidad: string | number;
  unidad: string;
  unidad_texto: string;
}
