import type { VercelRequest, VercelResponse } from '@vercel/node';
import { obtenerConfigOpenwa, enviarMensajeOpenwa } from '../lib/openwa';
import { firmaWebhookValida } from '../lib/whatsapp';
import { extraerMensajeOpenwa } from '../lib/openwaPayload';
import { marcarEventoProcesado } from '../lib/salesConversationStore';
import { responderComoAgenteVentas } from '../lib/salesWhatsappAgent';

// Body crudo (sin parsear) para poder verificar la firma HMAC X-OpenWA-Signature.
export const config = { api: { bodyParser: false } };

/**
 * POST /api/openwa-webhook — canal de WhatsApp del agente de ventas vía un gateway
 * OpenWA autohospedado (alternativa a /api/whatsapp-webhook, que usa Meta Cloud API).
 * Mismo agente, mismo catálogo y mismo historial en Redis; solo cambia cómo llegan y
 * cómo se mandan los mensajes.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { webhookSecret, sessionId: sesionEsperada } = obtenerConfigOpenwa();
  // A diferencia de Meta, aquí la firma es obligatoria: la URL del webhook es pública
  // y sin secreto cualquiera podría hacer que el agente le escriba a números arbitrarios.
  if (!webhookSecret) {
    res.status(503).json({ error: 'OpenWA no está configurado (falta OPENWA_WEBHOOK_SECRET)' });
    return;
  }

  const cuerpoCrudo = await leerCuerpoCrudo(req);
  const firmaRecibida = req.headers['x-openwa-signature'] as string | undefined;
  if (!firmaWebhookValida(cuerpoCrudo, firmaRecibida, webhookSecret)) {
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(cuerpoCrudo.toString('utf-8'));
  } catch {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  // Respondemos 200 aunque falle el procesamiento: OpenWA reintenta lo que no recibe
  // con 2xx, y un reintento a medias podría duplicar respuestas al prospecto.
  try {
    const mensaje = extraerMensajeOpenwa(payload);
    if (mensaje && (!sesionEsperada || mensaje.sessionId === sesionEsperada)) {
      if (await marcarEventoProcesado(`openwa:${mensaje.idempotencyKey}`)) {
        const respuesta = await responderComoAgenteVentas(
          `openwa:${mensaje.chatId}`,
          mensaje.texto,
        );
        await enviarMensajeOpenwa(mensaje.chatId, respuesta);
      }
    }
  } catch (error) {
    console.error('Error procesando webhook de OpenWA:', error);
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
