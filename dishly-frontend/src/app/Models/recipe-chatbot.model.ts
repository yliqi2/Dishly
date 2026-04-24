// recipe-chatbot.model.ts

// Sirve para definir la interfaz de un mensaje de chat
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  receta?: RecetaData | null;
  internetResult?: InternetSearchResult | null;
  isTyping?: boolean;
}

// Sirve para definir la interfaz de un resultado de búsqueda de internet
export interface InternetSearchResult {
  title: string;
  timeText: string;
  servingsText: string;
  summary?: string;
  sourceUrl: string;
}

// Sirve para definir la interfaz de una respuesta de receta
export interface RecetaResponse {
  status: string;
  source?: string;
  receta?: RecetaData | null;
  message?: string;
}

// Sirve para definir la interfaz de los datos de una receta
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
  price?: string | number | null;
  ingredientes: IngredienteResponse[];
  pasos: string[];
  imagenes: string[];
  imagen_principal: string | null;
  autor?: string;
  fecha_creacion?: string;
  mensaje_chat: string;
}

// Sirve para definir la interfaz de un ingrediente
export interface IngredienteResponse {
  nombre: string;
  cantidad: string | number;
  unidad: string;
  unidad_texto: string;
}
