/**
 * Cliente hacia un gateway OpenWA (https://github.com/rmyndharis/OpenWA) — segundo
 * canal de WhatsApp del agente de ventas, alternativo a Meta Cloud API (whatsapp.ts).
 *
 * OpenWA es autohospedado: corre en tu propio servidor/VPS con Docker y se vincula a un
 * número normal de WhatsApp escaneando un QR (como WhatsApp Web). Este backend solo le
 * habla por su API REST; la API key y el secreto del webhook viven solo en variables de
 * entorno del servidor.
 */

export function obtenerConfigOpenwa() {
  return {
    /** URL base del gateway, sin `/api` al final (ej. "https://openwa.midominio.com"). */
    baseUrl: process.env.OPENWA_BASE_URL?.replace(/\/+$/, ''),
    /** API key de rol OPERATOR (se crea en el dashboard de OpenWA). */
    apiKey: process.env.OPENWA_API_KEY,
    /** ID de la sesión de WhatsApp en OpenWA que contesta como agente de ventas. */
    sessionId: process.env.OPENWA_SESSION_ID,
    /** Secreto del webhook registrado en OpenWA (mín. 16 caracteres); firma X-OpenWA-Signature. */
    webhookSecret: process.env.OPENWA_WEBHOOK_SECRET,
  };
}

export function openwaConfigurado(): boolean {
  const { baseUrl, apiKey, sessionId, webhookSecret } = obtenerConfigOpenwa();
  return Boolean(baseUrl && apiKey && sessionId && webhookSecret);
}

/** Límite de `send-text` en OpenWA. */
const MAX_LARGO_TEXTO_OPENWA = 4096;

/** Envía un texto al chat indicado (`<número>@c.us` o `<id>@lid`, tal como llegó en el webhook). */
export async function enviarMensajeOpenwa(
  chatId: string,
  texto: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const { baseUrl, apiKey, sessionId } = obtenerConfigOpenwa();
  if (!baseUrl || !apiKey || !sessionId) {
    throw new Error(
      'OpenWA no está configurado en este servidor (faltan OPENWA_BASE_URL / OPENWA_API_KEY / OPENWA_SESSION_ID).',
    );
  }

  const respuesta = await fetchImpl(
    `${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/messages/send-text`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, text: texto.slice(0, MAX_LARGO_TEXTO_OPENWA) }),
    },
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    throw new Error(`OpenWA respondió con error ${respuesta.status}: ${cuerpo}`);
  }
}
