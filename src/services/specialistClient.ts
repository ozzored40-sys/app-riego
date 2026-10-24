/**
 * Cliente hacia POST /api/specialist-chat del backend (server/), que atiende a los
 * especialistas IA del Centro de Comando Chamán 4.0 (Athena, Chiron, Artemis, Mayahuel,
 * Hermes, Capi 1 y el redactor de anuncios). Mismo proxy seguro y mismas variables de
 * entorno que el agrónomo virtual (ver agronomistClient.ts).
 */
import {
  asistenteConfigurado,
  llamarBackend,
  type MensajeChat,
  type RespuestaAsistente,
} from './agronomistClient';
import type { IdEspecialista } from '../domain/chaman/especialistas';

export const especialistasConfigurados = asistenteConfigurado;

export function enviarMensajeEspecialista(
  especialistaId: IdEspecialista,
  mensajes: MensajeChat[],
  contexto?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RespuestaAsistente> {
  return llamarBackend('/api/specialist-chat', { especialistaId, mensajes, contexto }, fetchImpl);
}
