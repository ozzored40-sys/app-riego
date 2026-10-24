import type { ResultadoValidacion } from './validation';
import { obtenerClienteRedis, redisConfigurado } from './salesConversationStore';

/**
 * Reportes de respuestas de IA hechos desde la app (requisito de la política de contenido
 * generado por IA de Google Play: el usuario debe poder reportar contenido ofensivo o
 * inapropiado sin salir de la app). Cada reporte se escribe en los logs de Vercel y, si el
 * proyecto tiene Redis conectado, se guarda en la lista `reportes-ia` (últimos 1000).
 */

export const MOTIVOS_REPORTE = ['ofensivo', 'incorrecto', 'peligroso', 'otro'] as const;
export type MotivoReporte = (typeof MOTIVOS_REPORTE)[number];

export interface ReporteIa {
  origen: string;
  motivo: MotivoReporte;
  contenido: string;
  comentario?: string;
}

const MAX_CONTENIDO = 8000;
const MAX_COMENTARIO = 1000;
const MAX_ORIGEN = 60;
export const CLAVE_REPORTES = 'reportes-ia';
const MAX_REPORTES_GUARDADOS = 1000;

export function validarReporteIa(body: unknown): ResultadoValidacion<ReporteIa> {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Cuerpo de solicitud inválido' };
  }
  const { origen, motivo, contenido, comentario } = body as Partial<ReporteIa>;
  if (typeof origen !== 'string' || origen.length === 0 || origen.length > MAX_ORIGEN) {
    return { ok: false, error: 'Origen inválido' };
  }
  if (!MOTIVOS_REPORTE.includes(motivo as MotivoReporte)) {
    return { ok: false, error: 'Motivo inválido' };
  }
  if (typeof contenido !== 'string' || contenido.length === 0 || contenido.length > MAX_CONTENIDO) {
    return { ok: false, error: 'Contenido inválido' };
  }
  if (
    comentario !== undefined &&
    (typeof comentario !== 'string' || comentario.length > MAX_COMENTARIO)
  ) {
    return { ok: false, error: 'Comentario inválido' };
  }
  return { ok: true, datos: { origen, motivo: motivo as MotivoReporte, contenido, comentario } };
}

export async function guardarReporteIa(reporte: ReporteIa, fecha = new Date()): Promise<void> {
  const registro = JSON.stringify({ ...reporte, fecha: fecha.toISOString() });
  console.warn(`[reporte-ia] ${registro}`);
  if (redisConfigurado()) {
    const redis = obtenerClienteRedis();
    await redis.lpush(CLAVE_REPORTES, registro);
    await redis.ltrim(CLAVE_REPORTES, 0, MAX_REPORTES_GUARDADOS - 1);
  }
}
