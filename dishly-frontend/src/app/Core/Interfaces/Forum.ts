export interface ForumOwner {
  id_usuario: number;
  nombre: string;
  icon_path?: string | null;
  updated_at?: string | null;
}

export interface ForumComment {
  id_linea_foro: number;
  id_foro: number;
  id_usuario: number;
  mensaje: string;
  fecha: string;
  created_at?: string | null;
  updated_at?: string | null;
  autor_nombre: string;
  autor_icon_path?: string | null;
  autor_updated_at?: string | null;
  can_edit: boolean;
  can_delete: boolean;
}

export interface ForumSummary {
  id_foro: number;
  titulo: string;
  descripcion: string;
  fecha_creacion: string;
  created_at?: string | null;
  updated_at?: string | null;
  comments_count?: number | null;
  last_activity_at?: string | null;
  is_owner: boolean;
  owner: ForumOwner;
}

export interface ForumDetail extends ForumSummary {
  comments: ForumComment[];
}

export interface ForumCommentResponse {
  message: string;
  comment: ForumComment;
}
