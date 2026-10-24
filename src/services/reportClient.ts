/**
 * Cliente hacia POST /api/reportar-ia: el usuario reporta una respuesta de IA ofensiva,
 * incorrecta o peligrosa sin salir de la app (política de contenido generado por IA de
 * Google Play). Mismo backend y variables que agronomistClient.ts.
 */
import { llamarBackend, type RespuestaAsistente } from './agronomistClient';

export type MotivoReporte = 'ofensivo' | 'incorrecto' | 'peligroso' | 'otro';

export function reportarRespuestaIa(
  datos: { origen: string; motivo: MotivoReporte; contenido: string; comentario?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<RespuestaAsistente> {
  return llamarBackend('/api/reportar-ia', datos, fetchImpl);
}
