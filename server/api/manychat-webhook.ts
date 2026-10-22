import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { responderTurnoVentas } from '../lib/salesTurn';

/**
 * POST /api/manychat-webhook — mismo agente de ventas que /api/whatsapp-webhook, pero
 * para cuando el número de WhatsApp está conectado a ManyChat (ManyChat es dueño de la
 * conexión con Meta y llama aquí con una "External Request" desde su flujo de Default
 * Reply). No envía nada por WhatsApp: devuelve el texto en JSON y ManyChat lo manda.
 * Usa el mismo historial en Redis, con clave `manychat:<user_id>`.
 *
 * Body esperado (ver server/README.md): { user_id, phone?, first_name?, last_message }.
 * Respuesta: { response_text, lead_level } — en ManyChat se mapean a Custom User Fields.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  if (!tieneBearerValido(req.headers.authorization)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const userId = textoOVacio(body.user_id);
  const ultimoMensaje = textoOVacio(body.last_message);
  if (!userId || !ultimoMensaje) {
    res.status(400).json({ error: 'Faltan user_id o last_message' });
    return;
  }

  try {
    const { textoVisible, lead } = await responderTurnoVentas({
      idConversacion: `manychat:${userId}`,
      // Sin teléfono (ManyChat no siempre lo comparte) el lead se identifica por user_id.
      telefono: textoOVacio(body.phone).replace(/^\+/, '') || `manychat:${userId}`,
      canal: 'manychat',
      texto: ultimoMensaje,
      nombrePerfil: textoOVacio(body.first_name) || undefined,
    });
    res.status(200).json({ response_text: textoVisible, lead_level: lead?.nivel ?? '' });
  } catch (error) {
    console.error('Error procesando turno de ManyChat:', error);
    res.status(502).json({ error: 'No se pudo contactar al asistente' });
  }
}

/** ManyChat manda el header Authorization que se configure en la External Request. */
export function tieneBearerValido(header: string | undefined): boolean {
  const secreto = process.env.MANYCHAT_WEBHOOK_SECRET;
  // Igual que auth.ts: sin secreto configurado se rechaza en vez de dejarlo abierto.
  if (!secreto || !header) return false;
  const esperado = Buffer.from(`Bearer ${secreto}`);
  const recibido = Buffer.from(header);
  return esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
}

function textoOVacio(valor: unknown): string {
  if (typeof valor === 'number') return String(valor);
  return typeof valor === 'string' ? valor.trim() : '';
}
