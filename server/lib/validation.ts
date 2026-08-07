import type { ContextoLote, MensajeChat, SolicitudChat, SolicitudDiagnosticoFoto } from './types';

export type ResultadoValidacion<T> = { ok: true; datos: T } | { ok: false; error: string };

export const MAX_MENSAJES_CONVERSACION = 30;
export const MAX_LARGO_MENSAJE = 4000;
/** ~6MB en base64 (≈4.5MB de imagen real); la app debe comprimir antes de enviar. */
export const MAX_BASE64_BYTES = 6_000_000;

function esContextoLoteValido(valor: unknown): valor is ContextoLote {
  return (
    typeof valor === 'object' && valor !== null && typeof (valor as ContextoLote).cultivo === 'string'
  );
}

function esMensajeChatValido(valor: unknown): valor is MensajeChat {
  if (typeof valor !== 'object' || valor === null) return false;
  const mensaje = valor as MensajeChat;
  return (
    (mensaje.rol === 'user' || mensaje.rol === 'assistant') &&
    typeof mensaje.contenido === 'string' &&
    mensaje.contenido.length > 0 &&
    mensaje.contenido.length <= MAX_LARGO_MENSAJE
  );
}

export function validarSolicitudChat(body: unknown): ResultadoValidacion<SolicitudChat> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Cuerpo de solicitud inválido' };
  }
  const { mensajes, contexto } = body as Partial<SolicitudChat>;

  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    return { ok: false, error: 'Se requiere al menos un mensaje' };
  }
  if (mensajes.length > MAX_MENSAJES_CONVERSACION) {
    return { ok: false, error: `Máximo ${MAX_MENSAJES_CONVERSACION} mensajes por conversación` };
  }
  if (!mensajes.every(esMensajeChatValido)) {
    return { ok: false, error: 'Formato de mensaje inválido' };
  }
  if (!esContextoLoteValido(contexto)) {
    return { ok: false, error: 'Falta el contexto del lote (cultivo)' };
  }

  return { ok: true, datos: { mensajes, contexto } };
}

export function validarSolicitudDiagnosticoFoto(
  body: unknown,
): ResultadoValidacion<SolicitudDiagnosticoFoto> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Cuerpo de solicitud inválido' };
  }
  const { imagenBase64, mediaType, descripcion, contexto } = body as Partial<SolicitudDiagnosticoFoto>;

  if (typeof imagenBase64 !== 'string' || imagenBase64.length === 0) {
    return { ok: false, error: 'Falta la imagen' };
  }
  if (imagenBase64.length > MAX_BASE64_BYTES) {
    return { ok: false, error: 'La imagen es demasiado grande; comprime antes de subirla' };
  }
  if (mediaType !== 'image/jpeg' && mediaType !== 'image/png' && mediaType !== 'image/webp') {
    return { ok: false, error: 'Tipo de imagen no soportado (usa jpeg, png o webp)' };
  }
  if (
    descripcion !== undefined &&
    (typeof descripcion !== 'string' || descripcion.length > MAX_LARGO_MENSAJE)
  ) {
    return { ok: false, error: 'Descripción inválida' };
  }
  if (!esContextoLoteValido(contexto)) {
    return { ok: false, error: 'Falta el contexto del lote (cultivo)' };
  }

  return { ok: true, datos: { imagenBase64, mediaType, descripcion, contexto } };
}
