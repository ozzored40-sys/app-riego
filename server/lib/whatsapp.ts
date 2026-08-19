import crypto from 'node:crypto';
import type { MediaTypeImagen } from './types';

/** Versión de la Graph API de Meta usada para WhatsApp Cloud API. */
const GRAPH_API_VERSION = 'v22.0';
/** WhatsApp corta mensajes de texto en ~4096 caracteres; se parte en varios mensajes si hace falta. */
const LARGO_MAXIMO_MENSAJE_WHATSAPP = 4000;

function urlGraphApi(ruta: string): string {
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${ruta}`;
}

function tokenAcceso(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('Falta configurar WHATSAPP_ACCESS_TOKEN');
  return token;
}

function idNumeroTelefono(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('Falta configurar WHATSAPP_PHONE_NUMBER_ID');
  return id;
}

/**
 * Confirma el reto de verificación del webhook (GET). Meta llama a esta URL una vez, al
 * configurar el webhook en el panel de desarrolladores, para comprobar que el endpoint es tuyo.
 */
export function resolverDesafioVerificacion(query: {
  'hub.mode'?: string | string[];
  'hub.verify_token'?: string | string[];
  'hub.challenge'?: string | string[];
}): string | null {
  const modo = query['hub.mode'];
  const tokenRecibido = query['hub.verify_token'];
  const desafio = query['hub.challenge'];
  const tokenEsperado = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!tokenEsperado || modo !== 'subscribe' || tokenRecibido !== tokenEsperado) return null;
  return typeof desafio === 'string' ? desafio : null;
}

/**
 * Verifica que la solicitud POST venga realmente de Meta, usando la firma HMAC-SHA256
 * (header X-Hub-Signature-256) calculada con el App Secret. Sin esto, cualquiera que
 * descubra la URL del webhook podría mandar mensajes falsos a costa de tu API key.
 */
export function verificarFirmaWebhook(cuerpoCrudo: Buffer, firmaHeader: string | undefined): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !firmaHeader) return false;

  const firmaEsperada =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(cuerpoCrudo).digest('hex');

  const bufferRecibido = Buffer.from(firmaHeader);
  const bufferEsperado = Buffer.from(firmaEsperada);
  if (bufferRecibido.length !== bufferEsperado.length) return false;
  return crypto.timingSafeEqual(bufferRecibido, bufferEsperado);
}

export interface MensajeEntranteTexto {
  tipo: 'text';
  telefono: string;
  idMensaje: string;
  nombrePerfil?: string;
  texto: string;
}

export interface MensajeEntranteImagen {
  tipo: 'image';
  telefono: string;
  idMensaje: string;
  nombrePerfil?: string;
  idMedia: string;
  caption?: string;
}

export interface MensajeEntranteNoSoportado {
  tipo: 'no_soportado';
  telefono: string;
  idMensaje: string;
  nombrePerfil?: string;
  tipoOriginal: string;
}

export type MensajeEntrante = MensajeEntranteTexto | MensajeEntranteImagen | MensajeEntranteNoSoportado;

/**
 * Extrae los mensajes entrantes del payload del webhook de WhatsApp Cloud API. Un mismo
 * POST puede no traer mensajes (p. ej. notificaciones de "leído"/"entregado"), en cuyo caso
 * regresa un arreglo vacío.
 */
export function extraerMensajesEntrantes(payload: unknown): MensajeEntrante[] {
  const mensajes: MensajeEntrante[] = [];

  const entradas = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entradas)) return mensajes;

  for (const entrada of entradas) {
    const cambios = (entrada as { changes?: unknown[] })?.changes;
    if (!Array.isArray(cambios)) continue;

    for (const cambio of cambios) {
      const valor = (cambio as { value?: Record<string, unknown> })?.value;
      const mensajesCrudos = valor?.messages;
      if (!Array.isArray(mensajesCrudos)) continue;

      const contactos = (valor?.contacts ?? []) as { wa_id?: string; profile?: { name?: string } }[];

      for (const mensaje of mensajesCrudos as Record<string, unknown>[]) {
        const telefono = String(mensaje.from ?? '');
        const idMensaje = String(mensaje.id ?? '');
        if (!telefono || !idMensaje) continue;

        const nombrePerfil = contactos.find((c) => c.wa_id === telefono)?.profile?.name;
        const tipo = String(mensaje.type ?? '');

        if (tipo === 'text') {
          const texto = (mensaje.text as { body?: string } | undefined)?.body ?? '';
          if (!texto.trim()) continue;
          mensajes.push({ tipo: 'text', telefono, idMensaje, nombrePerfil, texto });
        } else if (tipo === 'image') {
          const imagen = mensaje.image as { id?: string; caption?: string } | undefined;
          if (!imagen?.id) continue;
          mensajes.push({
            tipo: 'image',
            telefono,
            idMensaje,
            nombrePerfil,
            idMedia: imagen.id,
            caption: imagen.caption,
          });
        } else {
          mensajes.push({ tipo: 'no_soportado', telefono, idMensaje, nombrePerfil, tipoOriginal: tipo });
        }
      }
    }
  }

  return mensajes;
}

const TIPOS_IMAGEN_SOPORTADOS: MediaTypeImagen[] = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Descarga una foto que el cliente mandó por WhatsApp: primero se pide la URL temporal del
 * archivo (requiere el access token), luego se descarga el binario (también con el token) y
 * se convierte a base64 para mandarlo a Claude igual que /api/diagnose-photo.
 */
export async function descargarMediaWhatsApp(
  idMedia: string,
): Promise<{ base64: string; mediaType: MediaTypeImagen } | null> {
  const token = tokenAcceso();

  const respuestaMetadata = await fetch(urlGraphApi(idMedia), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuestaMetadata.ok) return null;
  const metadata = (await respuestaMetadata.json()) as { url?: string; mime_type?: string };
  if (!metadata.url || !metadata.mime_type) return null;

  const mediaType = metadata.mime_type.split(';')[0].trim() as MediaTypeImagen;
  if (!TIPOS_IMAGEN_SOPORTADOS.includes(mediaType)) return null;

  const respuestaArchivo = await fetch(metadata.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuestaArchivo.ok) return null;
  const bytes = await respuestaArchivo.arrayBuffer();

  return { base64: Buffer.from(bytes).toString('base64'), mediaType };
}

function partirEnBloques(texto: string, largoMaximo: number): string[] {
  if (texto.length <= largoMaximo) return [texto];
  const bloques: string[] = [];
  let resto = texto;
  while (resto.length > largoMaximo) {
    let corte = resto.lastIndexOf('\n\n', largoMaximo);
    if (corte < largoMaximo * 0.5) corte = largoMaximo;
    bloques.push(resto.slice(0, corte).trim());
    resto = resto.slice(corte).trim();
  }
  if (resto) bloques.push(resto);
  return bloques;
}

/**
 * Manda un mensaje de texto por WhatsApp. Si el texto es muy largo lo parte en varios
 * mensajes seguidos (WhatsApp no soporta mensajes de longitud arbitraria).
 */
export async function enviarMensajeTexto(telefono: string, texto: string): Promise<void> {
  const token = tokenAcceso();
  const phoneNumberId = idNumeroTelefono();
  const bloques = partirEnBloques(texto.trim(), LARGO_MAXIMO_MENSAJE_WHATSAPP);

  for (const bloque of bloques) {
    if (!bloque) continue;
    const respuesta = await fetch(urlGraphApi(`${phoneNumberId}/messages`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'text',
        text: { body: bloque },
      }),
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      throw new Error(`Error enviando mensaje de WhatsApp (${respuesta.status}): ${detalle}`);
    }
  }
}

/** Marca un mensaje entrante como leído (doble palomita azul); nunca debe tumbar el flujo si falla. */
export async function marcarComoLeido(idMensaje: string): Promise<void> {
  try {
    const token = tokenAcceso();
    const phoneNumberId = idNumeroTelefono();
    await fetch(urlGraphApi(`${phoneNumberId}/messages`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: idMensaje }),
    });
  } catch (error) {
    console.error('No se pudo marcar el mensaje como leído:', error);
  }
}
