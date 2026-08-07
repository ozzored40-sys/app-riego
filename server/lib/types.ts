/** Contexto del lote que la app manda en cada solicitud, para que el agrónomo virtual no empiece de cero. */
export interface ContextoLote {
  cultivo: string;
  etapaFenologica?: string;
  sistemaProduccion?: string;
  edadDiasCultivo?: number;
  /** Resumen en texto plano del diagnóstico inicial por reglas de ese lote, si existe. */
  ultimoDiagnosticoReglas?: string;
}

export interface MensajeChat {
  rol: 'user' | 'assistant';
  contenido: string;
}

export interface SolicitudChat {
  mensajes: MensajeChat[];
  contexto: ContextoLote;
}

export interface RespuestaAsistente {
  respuesta: string;
}

export type MediaTypeImagen = 'image/jpeg' | 'image/png' | 'image/webp';

export interface SolicitudDiagnosticoFoto {
  imagenBase64: string;
  mediaType: MediaTypeImagen;
  descripcion?: string;
  contexto: ContextoLote;
}
