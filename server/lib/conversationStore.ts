import { Redis } from '@upstash/redis';
import type Anthropic from '@anthropic-ai/sdk';

/**
 * A diferencia de /api/chat (donde la app manda el historial completo en cada solicitud,
 * guardado localmente en SQLite en el celular del productor), WhatsApp no tiene "la app": el
 * webhook solo recibe un mensaje suelto por evento. Por eso el historial de cada número vive
 * aquí, en Redis (Upstash), del lado del servidor.
 */

let cliente: Redis | null = null;

function obtenerRedis(): Redis {
  if (!cliente) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Falta configurar UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN');
    }
    cliente = new Redis({ url, token });
  }
  return cliente;
}

/** Se guardan los mensajes tal cual los usa la API de Anthropic (incluye bloques de herramientas). */
export type MensajeConversacion = Anthropic.Messages.MessageParam;

/** 30 días sin actividad de ese número y se olvida la conversación. */
const TTL_SEGUNDOS_CONVERSACION = 60 * 60 * 24 * 30;
/** Tope de turnos que se mandan de vuelta a Claude, para no disparar el costo por tokens. */
export const MAX_MENSAJES_HISTORIAL = 40;
/** IDs de mensajes de WhatsApp ya procesados, para no contestar dos veces si Meta reintenta el webhook. */
const TTL_SEGUNDOS_IDEMPOTENCIA = 60 * 60 * 24;

function claveConversacion(telefono: string): string {
  return `whatsapp:conversacion:${telefono}`;
}

function claveMensajeProcesado(idMensaje: string): string {
  return `whatsapp:msg-procesado:${idMensaje}`;
}

export async function obtenerHistorial(telefono: string): Promise<MensajeConversacion[]> {
  const redis = obtenerRedis();
  const datos = await redis.get<MensajeConversacion[]>(claveConversacion(telefono));
  return datos ?? [];
}

export async function guardarHistorial(
  telefono: string,
  mensajes: MensajeConversacion[],
): Promise<void> {
  const redis = obtenerRedis();
  const recortado = mensajes.slice(-MAX_MENSAJES_HISTORIAL);
  await redis.set(claveConversacion(telefono), recortado, { ex: TTL_SEGUNDOS_CONVERSACION });
}

/**
 * Reserva atómicamente un ID de mensaje de WhatsApp como "ya procesado". Regresa true la
 * primera vez (hay que procesarlo) y false si ya se había visto (reintento de Meta: se ignora).
 */
export async function marcarMensajeComoNuevo(idMensaje: string): Promise<boolean> {
  const redis = obtenerRedis();
  const resultado = await redis.set(claveMensajeProcesado(idMensaje), 1, {
    ex: TTL_SEGUNDOS_IDEMPOTENCIA,
    nx: true,
  });
  return resultado === 'OK';
}
