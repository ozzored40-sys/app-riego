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

/** Insumo del catálogo Chamán tal como lo manda la app, para que el agente de ventas
 *  solo hable de productos y precios reales (nunca inventados). */
export interface ProductoCatalogoVentas {
  nombre: string;
  categoriaInsumo: string;
  presentacionComercial?: string;
  costoPorKg: number;
  unidadPrecio?: string;
}

/** Contexto del lote que la app manda en cada solicitud al agente de ventas virtual. */
export interface ContextoVentas {
  cultivo?: string;
  etapaFenologica?: string;
  sistemaProduccion?: string;
  /** Resumen en texto plano del diagnóstico inicial por reglas de ese lote, si existe. */
  ultimoDiagnosticoReglas?: string;
  catalogo: ProductoCatalogoVentas[];
}

export interface SolicitudChatVentas {
  mensajes: MensajeChat[];
  contexto: ContextoVentas;
}
