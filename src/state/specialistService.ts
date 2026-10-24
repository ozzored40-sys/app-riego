import type { AppDatabase } from '../data/db/types';
import {
  borrarHistorialEspecialista,
  crearSpecialistMessage,
  listarMensajesEspecialista,
  type SpecialistMessage,
} from '../data/repositories/specialistMessageRepository';
import { guardarProtocoloIaLead, obtenerLead } from '../data/repositories/leadRepository';
import { enviarMensajeEspecialista } from '../services/specialistClient';
import type { MensajeChat } from '../services/agronomistClient';
import { ID_COPYWRITER, type IdEspecialista } from '../domain/chaman/especialistas';

/** El backend acepta hasta 30 mensajes; se mandan los más recientes. */
export const MAX_MENSAJES_HISTORIAL = 30;

export function obtenerHistorialEspecialista(
  db: AppDatabase,
  especialistaId: IdEspecialista,
): SpecialistMessage[] {
  return listarMensajesEspecialista(db, especialistaId);
}

export function reiniciarConversacionEspecialista(
  db: AppDatabase,
  especialistaId: IdEspecialista,
): void {
  borrarHistorialEspecialista(db, especialistaId);
}

function aMensajesChat(historial: SpecialistMessage[]): MensajeChat[] {
  const recientes = historial.slice(-MAX_MENSAJES_HISTORIAL);
  // La conversación que recibe Claude debe empezar con un mensaje del usuario.
  const inicio = recientes.findIndex((m) => m.rol === 'user');
  return recientes.slice(Math.max(inicio, 0)).map((m) => ({
    rol: m.rol as 'user' | 'assistant',
    contenido: m.contenido,
  }));
}

/** Guarda el mensaje, llama al especialista con el historial reciente y guarda la respuesta. */
export async function enviarTurnoEspecialista(
  db: AppDatabase,
  especialistaId: IdEspecialista,
  mensajeUsuario: string,
): Promise<SpecialistMessage> {
  crearSpecialistMessage(db, { especialistaId, rol: 'user', contenido: mensajeUsuario });
  const mensajes = aMensajesChat(listarMensajesEspecialista(db, especialistaId));
  const { respuesta } = await enviarMensajeEspecialista(especialistaId, mensajes);
  return crearSpecialistMessage(db, { especialistaId, rol: 'assistant', contenido: respuesta });
}

/**
 * Pide a la Dra. Athena un protocolo ampliado para un dictamen ya guardado en el CRM y
 * lo guarda en el lead. No toca la conversación del chat de Athena.
 */
export async function generarProtocoloIa(db: AppDatabase, leadId: string): Promise<string> {
  const lead = obtenerLead(db, leadId);
  if (!lead) throw new Error('No se encontró el dictamen');
  const pregunta =
    'Con base en este dictamen de campo, redacta el protocolo técnico ampliado para el productor: ' +
    'diagnóstico probable, modo de acción, calendario de aplicación, manejo de suelo/riego y ' +
    'precauciones. Respeta las dosis del dictamen; no inventes datos de laboratorio.';
  const { respuesta } = await enviarMensajeEspecialista(
    'athena-phytopath',
    [{ rol: 'user', contenido: pregunta }],
    lead.dictamenTexto,
  );
  guardarProtocoloIaLead(db, leadId, respuesta);
  return respuesta;
}

/** Redacta un anuncio para Meta Ads con el agente redactor (sin historial). */
export async function generarCopyAnuncio(datos: {
  cultivo: string;
  problema: string;
  plataforma: string;
}): Promise<string> {
  const { respuesta } = await enviarMensajeEspecialista(ID_COPYWRITER, [
    {
      rol: 'user',
      contenido:
        `Escribe un anuncio para ${datos.plataforma} dirigido a productores de ${datos.cultivo} ` +
        `cuyo problema principal es: ${datos.problema}.`,
    },
  ]);
  return respuesta;
}
