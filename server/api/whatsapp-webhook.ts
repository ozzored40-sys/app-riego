import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  obtenerConfigWhatsapp,
  enviarMensajeWhatsapp,
  resolverVerificacionWebhook,
  firmaWebhookValida,
} from '../lib/whatsapp';
import { extraerMensajesDeTexto } from '../lib/whatsappPayload';
import { obtenerHistorialWhatsapp, agregarTurnoWhatsapp } from '../lib/salesConversationStore';
import { CATALOGO_VENTAS_WHATSAPP } from '../lib/salesCatalog';
import { obtenerClienteAnthropic, MODELO_AGRONOMO, MAX_TOKENS_RESPUESTA } from '../lib/anthropic';
import { SYSTEM_PROMPT_VENTAS, construirContextoVentas } from '../lib/prompts';
import { MAX_LARGO_MENSAJE } from '../lib/validation';
import type { MensajeChat } from '../lib/types';

// Desactiva el bodyParser automático de Vercel: necesitamos el body crudo (sin
// parsear) para poder verificar la firma HMAC que manda Meta en cada webhook.
export const config = { api: { bodyParser: false } };

/**
 * GET/POST /api/whatsapp-webhook — canal de WhatsApp del agente de ventas (Meta Cloud
 * API). GET es la verificación que hace Meta una sola vez al suscribir el webhook;
 * POST es cada mensaje entrante. A diferencia de /api/chat y /api/sales-chat (donde
 * la app manda el historial completo desde SQLite), aquí el servidor sí guarda
 * estado: el historial por número de WhatsApp vive en Vercel KV (ver
 * salesConversationStore.ts), porque no hay ninguna app detrás del prospecto.
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
    for (const { numeroDe, texto } of mensajesEntrantes) {
      await procesarMensajeEntrante(numeroDe, texto);
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

async function procesarMensajeEntrante(numeroDe: string, textoRecibido: string): Promise<void> {
  const texto = textoRecibido.slice(0, MAX_LARGO_MENSAJE);
  const mensajeUsuario: MensajeChat = { rol: 'user', contenido: texto };

  const historialPrevio = await obtenerHistorialWhatsapp(numeroDe);
  const mensajes: MensajeChat[] = [...historialPrevio, mensajeUsuario];

  const contexto = construirContextoVentas({ catalogo: CATALOGO_VENTAS_WHATSAPP });

  const anthropic = obtenerClienteAnthropic();
  const respuesta = await anthropic.messages.create({
    model: MODELO_AGRONOMO,
    max_tokens: MAX_TOKENS_RESPUESTA,
    system: `${SYSTEM_PROMPT_VENTAS}\n\nContexto:\n${contexto}`,
    messages: mensajes.map((m) => ({ role: m.rol, content: m.contenido })),
  });

  const textoRespuesta = respuesta.content
    .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
    .join('\n')
    .trim();

  await agregarTurnoWhatsapp(numeroDe, [
    mensajeUsuario,
    { rol: 'assistant', contenido: textoRespuesta },
  ]);
  await enviarMensajeWhatsapp(numeroDe, textoRespuesta);
}
