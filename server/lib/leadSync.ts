import type { DatosLead } from './leadData';
import { esNivelCaliente } from './leadData';

/**
 * Sincronización de leads calificados hacia Google Sheets y alertas al equipo de
 * ventas. Todo es opcional y se activa solo con su variable de entorno:
 * - LEADS_SHEETS_WEBHOOK_URL: URL de la Web App de Google Apps Script incluida en
 *   integrations/google-sheets-leads.gs (hace upsert por teléfono y mueve el lead
 *   entre las pestañas Nutricion_Leads y Leads_Calificados según su nivel).
 * - SLACK_WEBHOOK_URL y/o TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID: alerta inmediata
 *   cuando un lead entra a N3/N4.
 * Ninguna falla aquí debe impedir que el prospecto reciba su respuesta: quien llama
 * atrapa los errores (ver salesTurn.ts).
 */

export const PESTANA_NUTRICION = 'Nutricion_Leads';
export const PESTANA_CALIFICADOS = 'Leads_Calificados';

export interface RegistroLead extends DatosLead {
  telefono: string;
  canal: 'whatsapp' | 'manychat';
}

export function pestanaParaNivel(lead: DatosLead): string {
  return esNivelCaliente(lead.nivel) ? PESTANA_CALIFICADOS : PESTANA_NUTRICION;
}

export function estadoInicialParaNivel(lead: DatosLead): string {
  return esNivelCaliente(lead.nivel) ? 'Pendiente Contacto' : 'En Nutrición';
}

/** Solo se alerta al cruzar a N3/N4 (o de N3 a N4), no en cada mensaje de un lead que ya era caliente. */
export function debeAlertar(nivelAnterior: string | null, nivelNuevo: DatosLead['nivel']): boolean {
  if (!esNivelCaliente(nivelNuevo)) return false;
  return nivelAnterior !== nivelNuevo && nivelAnterior !== 'N4';
}

export async function sincronizarLeadEnSheets(
  registro: RegistroLead,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const url = process.env.LEADS_SHEETS_WEBHOOK_URL;
  if (!url) return;

  const respuesta = await fetchImpl(url, {
    method: 'POST',
    // Apps Script no lee headers personalizados, por eso el secreto va en el body.
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secreto: process.env.LEADS_SHEETS_SECRET ?? '',
      pestana: pestanaParaNivel(registro),
      estado: estadoInicialParaNivel(registro),
      telefono: registro.telefono,
      canal: registro.canal,
      nombre: registro.nombre ?? '',
      empresa: registro.empresa ?? '',
      cultivo: registro.cultivo ?? '',
      necesidad: registro.necesidad ?? '',
      presupuesto: registro.presupuesto ?? '',
      nivel: registro.nivel,
      siguienteAccion: registro.siguienteAccion ?? '',
    }),
  });
  // Apps Script siempre responde 200; el resultado real va en el JSON ({ ok, error }).
  const cuerpo = (await respuesta.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;
  if (!respuesta.ok || !cuerpo?.ok) {
    throw new Error(
      `Google Sheets rechazó el lead (${respuesta.status}): ${cuerpo?.error ?? 'respuesta inválida'}`,
    );
  }
}

export function textoAlertaLead(registro: RegistroLead): string {
  const lineas = [
    `🔥 Lead ${registro.nivel} por ${registro.canal === 'manychat' ? 'ManyChat' : 'WhatsApp'}`,
    `Teléfono: ${/^\d+$/.test(registro.telefono) ? `+${registro.telefono}` : registro.telefono}`,
  ];
  if (registro.nombre) lineas.push(`Nombre: ${registro.nombre}`);
  if (registro.empresa) lineas.push(`Empresa/rancho: ${registro.empresa}`);
  if (registro.cultivo) lineas.push(`Cultivo: ${registro.cultivo}`);
  if (registro.necesidad) lineas.push(`Necesidad: ${registro.necesidad}`);
  if (registro.presupuesto) lineas.push(`Presupuesto/volumen: ${registro.presupuesto}`);
  lineas.push(
    registro.nivel === 'N4'
      ? 'SLA: contacto humano en menos de 15 minutos.'
      : 'SLA: confirmar cita y enviar ficha técnica en menos de 2 horas.',
  );
  return lineas.join('\n');
}

export async function enviarAlertaLead(
  registro: RegistroLead,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const texto = textoAlertaLead(registro);
  const envios: Promise<Response>[] = [];

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    envios.push(
      fetchImpl(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto }),
      }),
    );
  }

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  if (telegramToken && telegramChatId) {
    envios.push(
      fetchImpl(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: texto }),
      }),
    );
  }

  const resultados = await Promise.allSettled(envios);
  for (const resultado of resultados) {
    if (resultado.status === 'rejected') {
      console.error('Error enviando alerta de lead:', resultado.reason);
    } else if (!resultado.value.ok) {
      console.error('Alerta de lead respondió con error', resultado.value.status);
    }
  }
}
