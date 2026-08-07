import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { soilAnalyses } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { NutrientAmounts } from '../../domain/types/nutrients';
import type { Textura } from '../../domain/soil/availabilityCoefficient';

export interface NuevoSoilAnalysis {
  loteId: string;
  fecha: string;
  textura: Textura;
  profundidadRadicularMm: number;
  materiaOrganicaPct: number;
  pH: number;
  ceDsM: number;
  cicMeq100g: number;
  densidadAparenteGCm3?: number;
  thetaCC?: number;
  thetaPMP?: number;
  humedadActualPct?: number;
  temperaturaSueloC?: number;
  nutrientesDisponiblesKgHa: NutrientAmounts;
}

export type SoilAnalysis = typeof soilAnalyses.$inferSelect;

export function crearSoilAnalysis(db: AppDatabase, datos: NuevoSoilAnalysis): SoilAnalysis {
  const fila = {
    id: generarId('suelo'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    textura: datos.textura,
    profundidadRadicularMm: datos.profundidadRadicularMm,
    materiaOrganicaPct: datos.materiaOrganicaPct,
    pH: datos.pH,
    ceDsM: datos.ceDsM,
    cicMeq100g: datos.cicMeq100g,
    densidadAparenteGCm3: datos.densidadAparenteGCm3 ?? null,
    thetaCC: datos.thetaCC ?? null,
    thetaPMP: datos.thetaPMP ?? null,
    humedadActualPct: datos.humedadActualPct ?? null,
    temperaturaSueloC: datos.temperaturaSueloC ?? null,
    nutrientesDisponiblesKgHa: datos.nutrientesDisponiblesKgHa,
    createdAt: ahoraISO(),
  };
  db.insert(soilAnalyses).values(fila).run();
  return fila;
}

export function ultimoSoilAnalysisDeLote(
  db: AppDatabase,
  loteId: string,
): SoilAnalysis | undefined {
  return db
    .select()
    .from(soilAnalyses)
    .where(eq(soilAnalyses.loteId, loteId))
    .orderBy(desc(soilAnalyses.fecha))
    .get();
}

export function listarSoilAnalysesDeLote(db: AppDatabase, loteId: string): SoilAnalysis[] {
  return db
    .select()
    .from(soilAnalyses)
    .where(eq(soilAnalyses.loteId, loteId))
    .orderBy(desc(soilAnalyses.fecha))
    .all();
}
