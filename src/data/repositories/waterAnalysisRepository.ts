import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { waterAnalyses, type IonesAgua } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { ConcentrationUnit } from '../../domain/types/nutrients';
import { normalizarIonesAPpm, calcularIndicesCalidad } from '../mappers/waterAnalysisMapper';

export interface NuevoWaterAnalysis {
  loteId: string;
  fecha: string;
  unidadCaptura: ConcentrationUnit;
  ionesCapturados: IonesAgua;
  pH: number;
  ceDsM: number;
}

export type WaterAnalysis = typeof waterAnalyses.$inferSelect;

/**
 * Crea un análisis de agua: normaliza los iones capturados (en la unidad que haya
 * elegido el usuario) a ppm y calcula SAR, dureza y alcalinidad una sola vez al
 * guardar, para no recalcularlos en cada pantalla que los use.
 */
export function crearWaterAnalysis(db: AppDatabase, datos: NuevoWaterAnalysis): WaterAnalysis {
  const ionesNormalizadosPpm = normalizarIonesAPpm(datos.ionesCapturados, datos.unidadCaptura);
  const { sar, dureza, alcalinidad } = calcularIndicesCalidad(ionesNormalizadosPpm);

  const fila = {
    id: generarId('agua'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    unidadCaptura: datos.unidadCaptura,
    ionesCapturados: datos.ionesCapturados,
    ionesNormalizadosPpm,
    pH: datos.pH,
    ceDsM: datos.ceDsM,
    sar,
    durezaMgLCaCO3: dureza,
    alcalinidadMgLCaCO3: alcalinidad,
    createdAt: ahoraISO(),
  };
  db.insert(waterAnalyses).values(fila).run();
  return fila;
}

export function ultimoWaterAnalysisDeLote(
  db: AppDatabase,
  loteId: string,
): WaterAnalysis | undefined {
  return db
    .select()
    .from(waterAnalyses)
    .where(eq(waterAnalyses.loteId, loteId))
    .orderBy(desc(waterAnalyses.fecha))
    .get();
}

export function listarWaterAnalysesDeLote(db: AppDatabase, loteId: string): WaterAnalysis[] {
  return db
    .select()
    .from(waterAnalyses)
    .where(eq(waterAnalyses.loteId, loteId))
    .orderBy(desc(waterAnalyses.fecha))
    .all();
}
