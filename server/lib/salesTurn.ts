import { obtenerClienteAnthropic, MODELO_AGRONOMO, MAX_TOKENS_RESPUESTA } from './anthropic';
import { SYSTEM_PROMPT_VENTAS, construirContextoVentas } from './prompts';
import { CATALOGO_VENTAS_WHATSAPP } from './salesCatalog';
import {
  obtenerHistorialWhatsapp,
  agregarTurnoWhatsapp,
  obtenerNivelLead,
  guardarNivelLead,
} from './salesConversationStore';
import { INSTRUCCIONES_CALIFICACION_LEAD, separarRespuestaYLead } from './leadData';
import type { DatosLead } from './leadData';
import { debeAlertar, enviarAlertaLead, sincronizarLeadEnSheets } from './leadSync';
import type { RegistroLead } from './leadSync';
import { MAX_LARGO_MENSAJE } from './validation';
import type { MensajeChat } from './types';

/**
 * Un turno del agente de ventas en un canal de WhatsApp (webhook directo de Meta o
 * ManyChat): lee el historial de Redis, llama a Claude con el prompt de ventas + las
 * instrucciones de calificación de leads, guarda el turno, y sincroniza el lead
 * (Sheets + alerta si subió a N3/N4). No envía nada al prospecto: cada canal entrega
 * `textoVisible` a su manera.
 */

export interface EntradaTurnoVentas {
  /** Clave de la conversación en Redis (número de WhatsApp, o `manychat:<user_id>`). */
  idConversacion: string;
  /** Teléfono del prospecto para el registro del lead (puede venir vacío en ManyChat). */
  telefono: string;
  canal: RegistroLead['canal'];
  texto: string;
  /** Nombre del perfil de WhatsApp, si el canal lo conoce. */
  nombrePerfil?: string;
}

export interface ResultadoTurnoVentas {
  textoVisible: string;
  lead: DatosLead | null;
}

const RESPUESTA_RESPALDO =
  'Gracias por tu mensaje 🙌 En un momento un asesor de Chamán te contacta para ayudarte.';

export function construirSystemPromptWhatsapp(nombrePerfil?: string): string {
  const contexto = [construirContextoVentas({ catalogo: CATALOGO_VENTAS_WHATSAPP })];
  if (nombrePerfil) contexto.push(`Nombre del perfil de WhatsApp: ${nombrePerfil}`);
  const enlaceAgenda = process.env.LINK_AGENDA_CITAS;
  if (enlaceAgenda) contexto.push(`Enlace de agenda para N3/N4: ${enlaceAgenda}`);

  return `${SYSTEM_PROMPT_VENTAS}\n\n${INSTRUCCIONES_CALIFICACION_LEAD}\n\nContexto:\n${contexto.join('\n')}`;
}

export async function responderTurnoVentas(
  entrada: EntradaTurnoVentas,
): Promise<ResultadoTurnoVentas> {
  const mensajeUsuario: MensajeChat = {
    rol: 'user',
    contenido: entrada.texto.slice(0, MAX_LARGO_MENSAJE),
  };
  const historialPrevio = await obtenerHistorialWhatsapp(entrada.idConversacion);
  const mensajes: MensajeChat[] = [...historialPrevio, mensajeUsuario];

  const respuesta = await obtenerClienteAnthropic().messages.create({
    model: MODELO_AGRONOMO,
    max_tokens: MAX_TOKENS_RESPUESTA,
    system: construirSystemPromptWhatsapp(entrada.nombrePerfil),
    messages: mensajes.map((m) => ({ role: m.rol, content: m.contenido })),
  });

  const textoModelo = respuesta.content
    .map((bloque) => (bloque.type === 'text' ? bloque.text : ''))
    .join('\n')
    .trim();
  const { textoVisible, lead } = separarRespuestaYLead(textoModelo);

  // Se guarda la respuesta completa (con <lead_data>) para que el modelo vea su propia
  // calificación previa en el siguiente turno y la mantenga consistente.
  await agregarTurnoWhatsapp(entrada.idConversacion, [
    mensajeUsuario,
    { rol: 'assistant', contenido: textoModelo },
  ]);

  if (lead) await registrarLead(entrada, lead);

  return { textoVisible: textoVisible || RESPUESTA_RESPALDO, lead };
}

async function registrarLead(entrada: EntradaTurnoVentas, lead: DatosLead): Promise<void> {
  const registro: RegistroLead = {
    ...lead,
    nombre: lead.nombre ?? entrada.nombrePerfil,
    telefono: entrada.telefono,
    canal: entrada.canal,
  };

  // El prospecto ya tiene su respuesta lista; un fallo de Sheets/alertas no debe
  // tumbarla, y un fallo de Sheets tampoco debe impedir la alerta (ni al revés).
  try {
    const nivelAnterior = await obtenerNivelLead(entrada.idConversacion);
    const [sheets] = await Promise.allSettled([
      sincronizarLeadEnSheets(registro),
      debeAlertar(nivelAnterior, lead.nivel) ? enviarAlertaLead(registro) : Promise.resolve(),
    ]);
    if (sheets.status === 'rejected') console.error('Error sincronizando lead:', sheets.reason);
    if (nivelAnterior !== lead.nivel) await guardarNivelLead(entrada.idConversacion, lead.nivel);
  } catch (error) {
    console.error('Error registrando lead:', error);
  }
}
