import crypto from 'node:crypto';

/**
 * Cliente hacia la API de WhatsApp Business (Meta Cloud API) para el canal de WhatsApp
 * del agente de ventas. Reglas de seguridad iguales en espíritu a auth.ts: los
 * secretos (token de acceso, app secret) viven solo en variables de entorno del
 * servidor, nunca en el código ni en la app móvil.
 */

const GRAPH_API_VERSION = 'v21.0';

export function obtenerConfigWhatsapp() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    /** Opcional: si está configurado, se verifica la firma de cada webhook entrante. */
    appSecret: process.env.WHATSAPP_APP_SECRET,
  };
}

export function whatsappConfigurado(): boolean {
  const { accessToken, phoneNumberId, verifyToken } = obtenerConfigWhatsapp();
  return Boolean(accessToken && phoneNumberId && verifyToken);
}

/** Envía un mensaje de texto simple por WhatsApp al número indicado (formato E.164 sin '+', ej. "5213320967184"). */
export async function enviarMensajeWhatsapp(
  numeroDestino: string,
  texto: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const { accessToken, phoneNumberId } = obtenerConfigWhatsapp();
  if (!accessToken || !phoneNumberId) {
    throw new Error(
      'WhatsApp no está configurado en este servidor (faltan WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).',
    );
  }

  const respuesta = await fetchImpl(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numeroDestino,
        type: 'text',
        text: { body: texto },
      }),
    },
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new Error(`WhatsApp respondió con error ${respuesta.status}: ${cuerpo}`);
  }
}

/** Responde al challenge de verificación que manda Meta al suscribir el webhook (una sola vez, por GET). */
export function resolverVerificacionWebhook(
  modo: unknown,
  tokenRecibido: unknown,
  challenge: unknown,
  verifyTokenEsperado: string | undefined,
): { ok: true; challenge: string } | { ok: false } {
  if (modo === 'subscribe' && verifyTokenEsperado && tokenRecibido === verifyTokenEsperado) {
    return { ok: true, challenge: String(challenge ?? '') };
  }
  return { ok: false };
}

/**
 * Verifica la firma HMAC-SHA256 (header X-Hub-Signature-256) que Meta manda en cada
 * webhook, usando el App Secret. Si no hay appSecret configurado, no hay nada que
 * verificar (permite operar sin firma mientras se configura, pero no es lo ideal).
 */
export function firmaWebhookValida(
  cuerpoCrudo: Buffer | string,
  firmaRecibida: string | undefined,
  appSecret: string,
): boolean {
  if (!firmaRecibida) return false;
  const firmaEsperada =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(cuerpoCrudo).digest('hex');
  const bufferEsperado = Buffer.from(firmaEsperada);
  const bufferRecibido = Buffer.from(firmaRecibida);
  if (bufferEsperado.length !== bufferRecibido.length) return false;
  return crypto.timingSafeEqual(bufferEsperado, bufferRecibido);
}
