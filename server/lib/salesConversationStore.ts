import { Redis } from '@upstash/redis';
import type { MensajeChat } from './types';
import { MAX_MENSAJES_CONVERSACION } from './validation';

/**
 * Historial de conversación del agente de ventas por WhatsApp, guardado en Redis
 * (Upstash) — a diferencia de /api/chat y /api/sales-chat (que reciben el historial
 * completo en cada solicitud porque la app lo guarda en SQLite local), el webhook de
 * WhatsApp no tiene ningún cliente que guarde nada: el servidor es el único lugar
 * donde puede vivir ese estado.
 *
 * Requiere una base de datos Redis conectada al proyecto (Vercel → Storage → Redis,
 * vía Marketplace de Upstash). Vercel inyecta las credenciales como variables de
 * entorno; se acepta tanto el nombre histórico (KV_REST_API_URL/TOKEN) como el nombre
 * nativo de Upstash (UPSTASH_REDIS_REST_URL/TOKEN), según cómo haya quedado la
 * integración.
 */

/** 7 días de inactividad y se olvida la conversación (evita acumular clientes viejos indefinidamente). */
const TTL_SEGUNDOS = 60 * 60 * 24 * 7;

let cliente: Redis | null = null;

function obtenerClienteRedis(): Redis {
  if (!cliente) {
    const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        'Falta la base de datos Redis del historial de WhatsApp (KV_REST_API_URL/KV_REST_API_TOKEN o UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).',
      );
    }
    cliente = new Redis({ url, token });
  }
  return cliente;
}

function claveConversacion(numeroWhatsapp: string): string {
  return `ventas:whatsapp:${numeroWhatsapp}`;
}

export async function obtenerHistorialWhatsapp(numeroWhatsapp: string): Promise<MensajeChat[]> {
  const historial = await obtenerClienteRedis().get<MensajeChat[]>(
    claveConversacion(numeroWhatsapp),
  );
  return historial ?? [];
}

/** Agrega uno o más turnos al final del historial, recortando al máximo de mensajes permitido. */
export async function agregarTurnoWhatsapp(
  numeroWhatsapp: string,
  nuevosMensajes: MensajeChat[],
): Promise<MensajeChat[]> {
  const historialPrevio = await obtenerHistorialWhatsapp(numeroWhatsapp);
  const actualizado = [...historialPrevio, ...nuevosMensajes].slice(-MAX_MENSAJES_CONVERSACION);
  await obtenerClienteRedis().set(claveConversacion(numeroWhatsapp), actualizado, {
    ex: TTL_SEGUNDOS,
  });
  return actualizado;
}

export async function borrarHistorialWhatsapp(numeroWhatsapp: string): Promise<void> {
  await obtenerClienteRedis().del(claveConversacion(numeroWhatsapp));
}
