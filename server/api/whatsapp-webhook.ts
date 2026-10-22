import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  obtenerConfigWhatsapp,
  enviarMensajeWhatsapp,
  resolverVerificacionWebhook,
  firmaWebhookValida,
} from '../lib/whatsapp';
import { extraerMensajesDeTexto } from '../lib/whatsappPayload';
import { responderTurnoVentas } from '../lib/salesTurn';

// Desactiva el bodyParser automático de Vercel: necesitamos el body crudo (sin
// parsear) para poder verificar la firma HMAC que manda Meta en cada webhook.
export const config = { api: { bodyParser: false } };

/**
 * GET/POST /api/whatsapp-webhook — canal de WhatsApp del agente de ventas (Meta Cloud
 * API). GET es la verificación que hace Meta una sola vez al suscribir el webhook;
 * POST es cada mensaje entrante. A diferencia de /api/chat y /api/sales-chat (donde
 * la app manda el historial completo desde SQLite), aquí el servidor sí guarda
 * estado: el historial por número de WhatsApp vive en Vercel KV (ver
 * salesConversationStore.ts), porque no hay ninguna app detrás del prospecto. Cada
 * turno además califica al prospecto (N1–N4) y lo sincroniza a Google Sheets /
 * alertas (ver salesTurn.ts y leadSync.ts).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { verifyToken, appSecret } = obtenerConfigWhatsapp();

  if (req.method === 'GET') {
    const resultado = resolverVerificacionWebhook(
      req.query['hub.mode'],
      req.query['hub.verify_token'],
      req.query['hub.challenge'],
      verifyToken,
    );
    if (resultado.ok) {
      res.status(200).send(resultado.challenge);
    } else {
      res.status(403).send('Verificación fallida');
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const cuerpoCrudo = await leerCuerpoCrudo(req);

  if (appSecret) {
    const firmaRecibida = req.headers['x-hub-signature-256'] as string | undefined;
    if (!firmaWebhookValida(cuerpoCrudo, firmaRecibida, appSecret)) {
      res.status(401).json({ error: 'Firma inválida' });
      return;
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(cuerpoCrudo.toString('utf-8'));
  } catch {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  // Siempre respondemos 200 al final (incluso si un mensaje falla): si Meta no ve un
  // 200 a tiempo, reintenta el webhook completo, duplicando mensajes ya procesados.
  try {
    const mensajesEntrantes = extraerMensajesDeTexto(payload);
    for (const { numeroDe, texto, nombrePerfil } of mensajesEntrantes) {
      await procesarMensajeEntrante(numeroDe, texto, nombrePerfil);
    }
  } catch (error) {
    console.error('Error procesando webhook de WhatsApp:', error);
  }

  res.status(200).json({ ok: true });
}

async function leerCuerpoCrudo(req: VercelRequest): Promise<Buffer> {
  const partes: Buffer[] = [];
  for await (const parte of req) {
    partes.push(parte as Buffer);
  }
  return Buffer.concat(partes);
}

async function procesarMensajeEntrante(
  numeroDe: string,
  texto: string,
  nombrePerfil?: string,
): Promise<void> {
  const { textoVisible } = await responderTurnoVentas({
    idConversacion: numeroDe,
    telefono: numeroDe,
    canal: 'whatsapp',
    texto,
    nombrePerfil,
  });
  await enviarMensajeWhatsapp(numeroDe, textoVisible);
}
