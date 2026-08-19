import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Anthropic from '@anthropic-ai/sdk';
import { obtenerClienteAnthropic, MODELO_AGRONOMO } from '../lib/anthropic';
import { SYSTEM_PROMPT_VENTAS_AGRONOMO } from '../lib/prompts';
import { ejecutarTurnoConHerramientas } from '../lib/agentLoop';
import { HERRAMIENTAS_WHATSAPP, ejecutarHerramientaWhatsApp } from '../lib/whatsappTools';
import {
  extraerMensajesEntrantes,
  resolverDesafioVerificacion,
  verificarFirmaWebhook,
  enviarMensajeTexto,
  marcarComoLeido,
  descargarMediaWhatsApp,
  type MensajeEntrante,
} from '../lib/whatsapp';
import { obtenerHistorial, guardarHistorial, marcarMensajeComoNuevo } from '../lib/conversationStore';

/**
 * Webhook de WhatsApp Cloud API (Meta) — el agente de Chamán Agro Soluciones que diagnostica
 * como ingeniero agrónomo y vende usando el catálogo real (ver lib/catalog.json).
 *
 * GET  → verificación del webhook (Meta la llama una sola vez, al configurar la URL).
 * POST → mensajes entrantes de WhatsApp.
 *
 * El body parser de Vercel se desactiva para poder validar la firma HMAC sobre el body crudo
 * (ver lib/whatsapp.ts#verificarFirmaWebhook) antes de confiar en el contenido.
 */
export const config = { api: { bodyParser: false } };

/** Tamaño máximo del body aceptado, para no leer un stream gigante malicioso a memoria. */
const MAX_BYTES_BODY = 2_000_000;

async function leerCuerpoCrudo(req: VercelRequest): Promise<Buffer> {
  const partes: Buffer[] = [];
  let bytesLeidos = 0;
  for await (const parte of req) {
    const buffer = typeof parte === 'string' ? Buffer.from(parte) : (parte as Buffer);
    bytesLeidos += buffer.length;
    if (bytesLeidos > MAX_BYTES_BODY) throw new Error('Body de webhook demasiado grande');
    partes.push(buffer);
  }
  return Buffer.concat(partes);
}

async function procesarMensaje(mensaje: MensajeEntrante): Promise<void> {
  if (mensaje.tipo === 'no_soportado') {
    await enviarMensajeTexto(
      mensaje.telefono,
      'Por ahora solo puedo leer texto y fotos 🙂 Cuéntame qué está pasando con tu cultivo, o mándame una foto.',
    );
    return;
  }

  const anthropic = obtenerClienteAnthropic();
  const historial = await obtenerHistorial(mensaje.telefono);

  let contenidoUsuario: Anthropic.Messages.MessageParam['content'];
  if (mensaje.tipo === 'text') {
    contenidoUsuario = mensaje.texto;
  } else {
    const media = await descargarMediaWhatsApp(mensaje.idMedia);
    if (!media) {
      await enviarMensajeTexto(
        mensaje.telefono,
        'No pude descargar esa foto (o el formato no es compatible, uso jpg/png/webp). ¿Me la puedes volver a mandar?',
      );
      return;
    }
    contenidoUsuario = [
      { type: 'image', source: { type: 'base64', media_type: media.mediaType, data: media.base64 } },
      { type: 'text', text: mensaje.caption?.trim() || 'Analiza esta foto de mi cultivo.' },
    ];
  }

  const mensajesConTurno = [...historial, { role: 'user' as const, content: contenidoUsuario }];

  const { mensajes: mensajesActualizados, textoFinal } = await ejecutarTurnoConHerramientas({
    anthropic,
    modelo: MODELO_AGRONOMO,
    maxTokens: 1024,
    system: SYSTEM_PROMPT_VENTAS_AGRONOMO,
    mensajes: mensajesConTurno,
    tools: HERRAMIENTAS_WHATSAPP,
    ejecutarHerramienta: (nombre, input) =>
      ejecutarHerramientaWhatsApp(nombre, input, { telefonoCliente: mensaje.telefono }),
  });

  await guardarHistorial(mensaje.telefono, mensajesActualizados);

  if (textoFinal) {
    await enviarMensajeTexto(mensaje.telefono, textoFinal);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const desafio = resolverDesafioVerificacion(req.query as Record<string, string | string[]>);
    if (desafio === null) {
      res.status(403).send('Verificación fallida');
      return;
    }
    res.status(200).send(desafio);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  let cuerpoCrudo: Buffer;
  try {
    cuerpoCrudo = await leerCuerpoCrudo(req);
  } catch {
    res.status(413).json({ error: 'Body demasiado grande' });
    return;
  }

  const firmaValida = verificarFirmaWebhook(cuerpoCrudo, req.headers['x-hub-signature-256'] as string | undefined);
  if (!firmaValida) {
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

  // Se responde 200 siempre que el payload sea legítimo (aunque el procesamiento de algún
  // mensaje falle abajo): si Meta ve errores repetidos, puede desactivar el webhook.
  res.status(200).json({ recibido: true });

  const mensajes = extraerMensajesEntrantes(payload);
  for (const mensaje of mensajes) {
    try {
      const esNuevo = await marcarMensajeComoNuevo(mensaje.idMensaje);
      if (!esNuevo) continue; // reintento de Meta del mismo mensaje: ya se contestó

      await marcarComoLeido(mensaje.idMensaje);
      await procesarMensaje(mensaje);
    } catch (error) {
      console.error('Error procesando mensaje de WhatsApp:', error);
      try {
        await enviarMensajeTexto(
          mensaje.telefono,
          'Tuve un problema para responder eso. ¿Me lo puedes repetir en un momento?',
        );
      } catch (errorSecundario) {
        console.error('También falló el mensaje de error al cliente:', errorSecundario);
      }
    }
  }
}
