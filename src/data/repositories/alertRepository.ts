import { eq, desc, and } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { alerts } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { NivelSemaforo } from '../../domain/monitoring/semaphore';

export interface NuevaAlert {
  loteId: string;
  fecha: string;
  nivel: NivelSemaforo;
  metrica: string;
  desviacionPct: number;
  mensaje: string;
  posiblesCausas: string[];
  accionSugerida?: string;
}

export type Alert = typeof alerts.$inferSelect;

export function crearAlert(db: AppDatabase, datos: NuevaAlert): Alert {
  const fila = {
    id: generarId('alerta'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    nivel: datos.nivel,
    metrica: datos.metrica,
    desviacionPct: datos.desviacionPct,
    mensaje: datos.mensaje,
    posiblesCausas: datos.posiblesCausas,
    accionSugerida: datos.accionSugerida ?? null,
    resuelto: false,
    createdAt: ahoraISO(),
  };
  db.insert(alerts).values(fila).run();
  return fila;
}

export function listarAlertasDeLote(
  db: AppDatabase,
  loteId: string,
  soloNoResueltas = false,
): Alert[] {
  const condicion = soloNoResueltas
    ? and(eq(alerts.loteId, loteId), eq(alerts.resuelto, false))
    : eq(alerts.loteId, loteId);
  return db.select().from(alerts).where(condicion).orderBy(desc(alerts.fecha)).all();
}

export function marcarAlertaResuelta(db: AppDatabase, id: string): void {
  db.update(alerts).set({ resuelto: true }).where(eq(alerts.id, id)).run();
}
