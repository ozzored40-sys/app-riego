/**
 * Parsing del payload que manda el webhook de WhatsApp Business (Meta Cloud API).
 * Forma documentada en https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples.
 * Solo nos interesan los mensajes de texto entrantes de usuarios; se ignoran en
 * silencio otros tipos (imagen, ubicación, etc.) y los recibos de estado (sent/
 * delivered/read) que Meta manda por el mismo webhook.
 */

export interface MensajeTextoEntrante {
  numeroDe: string;
  texto: string;
}

/** `unknown` intencional: es el body crudo de un webhook externo, nunca confiar en su forma. */
export function extraerMensajesDeTexto(payload: unknown): MensajeTextoEntrante[] {
  const mensajes: MensajeTextoEntrante[] = [];

  const entradas = objetoArray(payload, 'entry');
  for (const entrada of entradas) {
    const cambios = objetoArray(entrada, 'changes');
    for (const cambio of cambios) {
      const valor = campo(cambio, 'value');
      const mensajesEntrantes = objetoArray(valor, 'messages');
      for (const mensaje of mensajesEntrantes) {
        const numeroDe = campo(mensaje, 'from');
        const tipo = campo(mensaje, 'type');
        const texto = campo(campo(mensaje, 'text'), 'body');
        if (tipo === 'text' && typeof numeroDe === 'string' && typeof texto === 'string') {
          mensajes.push({ numeroDe, texto });
        }
      }
    }
  }

  return mensajes;
}

function campo(valor: unknown, clave: string): unknown {
  if (typeof valor !== 'object' || valor === null) return undefined;
  return (valor as Record<string, unknown>)[clave];
}

function objetoArray(valor: unknown, clave: string): unknown[] {
  const arreglo = campo(valor, clave);
  return Array.isArray(arreglo) ? arreglo : [];
}
