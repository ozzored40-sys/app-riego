/**
 * Parsing del webhook de OpenWA (evento `message.received`). Forma documentada en
 * docs/06-api-specification.md §6.6 del repo de OpenWA:
 *
 *   { event, timestamp, sessionId, idempotencyKey, deliveryId, data: { id, from, chatId,
 *     body, type, fromMe, isGroup, kind, ... } }
 *
 * Solo contestamos texto de chats individuales que no mandamos nosotros mismos; se
 * ignoran grupos, estados, canales, multimedia y los demás eventos.
 */

export interface MensajeOpenwaEntrante {
  /** Sesión de OpenWA que recibió el mensaje. */
  sessionId: string;
  /** Chat al que hay que contestar (`<número>@c.us` o `<id>@lid`). */
  chatId: string;
  texto: string;
  /** Clave estable entre reintentos del mismo evento (para no contestar dos veces). */
  idempotencyKey: string;
}

/** `unknown` intencional: es el body crudo de un webhook externo, nunca confiar en su forma. */
export function extraerMensajeOpenwa(payload: unknown): MensajeOpenwaEntrante | null {
  if (campo(payload, 'event') !== 'message.received') return null;

  const sessionId = campo(payload, 'sessionId');
  const data = campo(payload, 'data');
  const chatId = campo(data, 'chatId');
  const texto = campo(data, 'body');
  const idMensaje = campo(data, 'id');
  const idempotencyKey = campo(payload, 'idempotencyKey') ?? idMensaje;

  if (campo(data, 'fromMe') === true) return null;
  if (campo(data, 'isGroup') === true) return null;
  const kind = campo(data, 'kind');
  if (kind !== undefined && kind !== 'individual') return null;
  if (campo(data, 'type') !== 'text') return null;

  if (
    typeof sessionId !== 'string' ||
    typeof chatId !== 'string' ||
    typeof texto !== 'string' ||
    typeof idempotencyKey !== 'string' ||
    texto.trim() === ''
  ) {
    return null;
  }

  return { sessionId, chatId, texto, idempotencyKey };
}

function campo(valor: unknown, clave: string): unknown {
  if (typeof valor !== 'object' || valor === null) return undefined;
  return (valor as Record<string, unknown>)[clave];
}
