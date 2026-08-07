import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { climateData } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevoClimateData {
  loteId: string;
  fecha: string;
  etoMmDia: number;
  lluviaMm: number;
  tempMaxC?: number;
  tempMinC?: number;
  tempPromedioC?: number;
  humedadRelativaPct?: number;
  radiacionSolar?: number;
  velocidadVientoMS?: number;
  fuente: 'manual' | 'open-meteo';
}

export type ClimateData = typeof climateData.$inferSelect;

export function crearClimateData(db: AppDatabase, datos: NuevoClimateData): ClimateData {
  const fila = {
    id: generarId('clima'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    etoMmDia: datos.etoMmDia,
    lluviaMm: datos.lluviaMm,
    tempMaxC: datos.tempMaxC ?? null,
    tempMinC: datos.tempMinC ?? null,
    tempPromedioC: datos.tempPromedioC ?? null,
    humedadRelativaPct: datos.humedadRelativaPct ?? null,
    radiacionSolar: datos.radiacionSolar ?? null,
    velocidadVientoMS: datos.velocidadVientoMS ?? null,
    fuente: datos.fuente,
    createdAt: ahoraISO(),
  };
  db.insert(climateData).values(fila).run();
  return fila;
}

export function ultimoClimateDataDeLote(db: AppDatabase, loteId: string): ClimateData | undefined {
  return db
    .select()
    .from(climateData)
    .where(eq(climateData.loteId, loteId))
    .orderBy(desc(climateData.fecha))
    .get();
}
