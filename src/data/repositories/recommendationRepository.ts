import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { dailyRecommendations } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { DailyRecommendation } from '../../domain/types/recommendation';

export type DailyRecommendationRow = typeof dailyRecommendations.$inferSelect;

export function guardarRecomendacion(
  db: AppDatabase,
  loteId: string,
  fecha: string,
  recomendacion: DailyRecommendation,
): DailyRecommendationRow {
  const fila = {
    id: generarId('recomendacion'),
    loteId,
    fecha,
    etapaId: recomendacion.etapa.id,
    dataJson: recomendacion,
    generatedAt: ahoraISO(),
  };
  db.insert(dailyRecommendations).values(fila).run();
  return fila;
}

export function ultimaRecomendacionDeLote(
  db: AppDatabase,
  loteId: string,
): DailyRecommendationRow | undefined {
  return db
    .select()
    .from(dailyRecommendations)
    .where(eq(dailyRecommendations.loteId, loteId))
    .orderBy(desc(dailyRecommendations.generatedAt))
    .get();
}

export function historialRecomendacionesDeLote(
  db: AppDatabase,
  loteId: string,
): DailyRecommendationRow[] {
  return db
    .select()
    .from(dailyRecommendations)
    .where(eq(dailyRecommendations.loteId, loteId))
    .orderBy(desc(dailyRecommendations.generatedAt))
    .all();
}
