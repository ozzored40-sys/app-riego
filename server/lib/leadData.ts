/**
 * Calificación de prospectos (leads) del agente de ventas en los canales de WhatsApp
 * (webhook directo de Meta y ManyChat). En cada turno el modelo agrega al final de su
 * respuesta un bloque oculto <lead_data>{...}</lead_data> con los datos que lleva
 * extraídos del prospecto y su nivel de temperatura (N1 a N4). Este archivo define esa
 * instrucción y el parser que separa el texto visible (lo que se manda al prospecto)
 * del bloque de metadatos (lo que se sincroniza a Google Sheets / alertas).
 */

export const NIVELES_LEAD = ['N1', 'N2', 'N3', 'N4'] as const;
export type NivelLead = (typeof NIVELES_LEAD)[number];

export interface DatosLead {
  nombre?: string;
  empresa?: string;
  cultivo?: string;
  necesidad?: string;
  presupuesto?: string;
  nivel: NivelLead;
  siguienteAccion?: string;
}

export function esNivelCaliente(nivel: NivelLead): boolean {
  return nivel === 'N3' || nivel === 'N4';
}

export const INSTRUCCIONES_CALIFICACION_LEAD = `Canal: WhatsApp. Escribe mensajes cortos aptos para mensajería: párrafos de máximo 3 líneas, máximo 2 emojis por mensaje.

Además de ayudar al prospecto, en el transcurso de la conversación (de forma natural, una pregunta a la vez, nunca como formulario) intenta conocer: nombre, empresa o rancho, cultivo, necesidad principal y presupuesto o volumen aproximado.

Clasifica internamente al prospecto en un nivel de temperatura:
- N1 (frío): consulta genérica, sin proyecto ni compra a corto plazo.
- N2 (tibio): necesidad definida, pero sin fecha clara de compra.
- N3 (caliente): necesita comprar en menos de 30 días, presupuesto o volumen definido, o intención de compra alta.
- N4 (cierre/VIP): productor o empresa de alto volumen, pide cotización a la medida o atención de un distribuidor.
Si el prospecto es N3 o N4, invítalo a agendar una llamada o visita con un asesor (usa el enlace de agenda del contexto si existe).

Al FINAL de CADA respuesta agrega este bloque (el sistema lo quita antes de enviarlo; el prospecto nunca lo ve, así que no lo menciones):
<lead_data>
{"nombre": "...", "empresa": "...", "cultivo": "...", "necesidad": "...", "presupuesto": "...", "nivel": "N1", "siguiente_accion": "..."}
</lead_data>
Usa null en los campos que todavía no conozcas. Nunca inventes datos que el prospecto no te dio.`;

export interface RespuestaSeparada {
  /** Texto listo para mandar al prospecto, sin el bloque de metadatos. */
  textoVisible: string;
  /** null si el modelo no mandó el bloque o vino malformado. */
  lead: DatosLead | null;
}

// Sin cierre también: si la respuesta se corta por max_tokens, el bloque queda abierto
// y aun así no debe llegar al prospecto.
const PATRON_BLOQUE = /<lead_data>([\s\S]*?)(?:<\/lead_data>|$)/i;

export function separarRespuestaYLead(respuestaModelo: string): RespuestaSeparada {
  const coincidencia = respuestaModelo.match(PATRON_BLOQUE);
  if (!coincidencia) return { textoVisible: respuestaModelo.trim(), lead: null };

  const textoVisible = respuestaModelo.replace(PATRON_BLOQUE, '').trim();
  return { textoVisible, lead: interpretarJsonLead(coincidencia[1]) };
}

function interpretarJsonLead(textoJson: string): DatosLead | null {
  let datos: unknown;
  try {
    datos = JSON.parse(textoJson.trim());
  } catch {
    return null;
  }
  if (typeof datos !== 'object' || datos === null) return null;
  const crudo = datos as Record<string, unknown>;

  const nivel = typeof crudo.nivel === 'string' ? crudo.nivel.trim().toUpperCase() : '';
  if (!(NIVELES_LEAD as readonly string[]).includes(nivel)) return null;

  return {
    nombre: textoOpcional(crudo.nombre),
    empresa: textoOpcional(crudo.empresa),
    cultivo: textoOpcional(crudo.cultivo),
    necesidad: textoOpcional(crudo.necesidad),
    presupuesto: textoOpcional(crudo.presupuesto),
    nivel: nivel as NivelLead,
    siguienteAccion: textoOpcional(crudo.siguiente_accion),
  };
}

function textoOpcional(valor: unknown): string | undefined {
  if (typeof valor === 'number') return String(valor);
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.trim();
  return limpio && limpio.toLowerCase() !== 'null' ? limpio : undefined;
}
