import type { AppDatabase } from '../data/db/types';
import {
  crearChatMessage,
  listarChatMessagesDeLote,
  borrarHistorialChat,
  type ChatMessage,
} from '../data/repositories/chatMessageRepository';
import { obtenerInfoBaseLote } from './loteContextHelpers';
import {
  enviarMensajeChat,
  enviarFotoParaDiagnostico,
  type ContextoLote,
  type MensajeChat,
} from '../services/agronomistClient';
import type { FotoCapturada } from '../services/photoCapture';

/** Arma el contexto del lote (cultivo, etapa, diagnóstico por reglas) para dárselo al agrónomo virtual. */
export function construirContextoLote(db: AppDatabase, loteId: string): ContextoLote {
  const info = obtenerInfoBaseLote(db, loteId);
  return {
    cultivo: info.cultivoNombre,
    etapaFenologica: info.etapaFenologica,
    sistemaProduccion: info.sistemaProduccion,
    edadDiasCultivo: info.edadDiasCultivo,
    ultimoDiagnosticoReglas: info.ultimoDiagnosticoReglas,
  };
}

export function obtenerHistorialChat(db: AppDatabase, loteId: string): ChatMessage[] {
  return listarChatMessagesDeLote(db, loteId);
}

export function reiniciarConversacion(db: AppDatabase, loteId: string): void {
  borrarHistorialChat(db, loteId);
}

/** Guarda el mensaje del productor, llama al backend con el historial completo, y guarda la respuesta. */
export async function enviarTurnoChat(
  db: AppDatabase,
  loteId: string,
  mensajeUsuario: string,
): Promise<ChatMessage> {
  crearChatMessage(db, { loteId, rol: 'user', contenido: mensajeUsuario });

  const historial = listarChatMessagesDeLote(db, loteId);
  const mensajes: MensajeChat[] = historial.map((m) => ({
    rol: m.rol as 'user' | 'assistant',
    contenido: m.contenido,
  }));
  const contexto = construirContextoLote(db, loteId);

  const { respuesta } = await enviarMensajeChat(mensajes, contexto);
  return crearChatMessage(db, { loteId, rol: 'assistant', contenido: respuesta });
}

/**
 * Envía una foto para diagnóstico. La imagen en sí no se guarda en SQLite (para no
 * inflar la base de datos local): se registra en el historial una nota de que se
 * envió una foto, y la respuesta del agrónomo virtual sí queda guardada completa.
 */
export async function enviarFotoChat(
  db: AppDatabase,
  loteId: string,
  foto: FotoCapturada,
  descripcion?: string,
): Promise<ChatMessage> {
  const notaUsuario = descripcion?.trim()
    ? `📷 Foto enviada: ${descripcion.trim()}`
    : '📷 Foto enviada para diagnóstico';
  crearChatMessage(db, { loteId, rol: 'user', contenido: notaUsuario });

  const contexto = construirContextoLote(db, loteId);
  const { respuesta } = await enviarFotoParaDiagnostico(
    foto.base64,
    foto.mediaType,
    contexto,
    descripcion,
  );
  return crearChatMessage(db, { loteId, rol: 'assistant', contenido: respuesta });
}
