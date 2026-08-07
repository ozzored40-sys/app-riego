import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { sapReadings } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevaSapReading {
  loteId: string;
  fecha: string;
  etapaId?: string;
  no3Ppm?: number;
  kPpm?: number;
  caPpm?: number;
  naPpm?: number;
  hojaMuestreada?: string;
  observaciones?: string;
}

export type SapReading = typeof sapReadings.$inferSelect;

export function crearSapReading(db: AppDatabase, datos: NuevaSapReading): SapReading {
  const fila = {
    id: generarId('savia'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    etapaId: datos.etapaId ?? null,
    no3Ppm: datos.no3Ppm ?? null,
    kPpm: datos.kPpm ?? null,
    caPpm: datos.caPpm ?? null,
    naPpm: datos.naPpm ?? null,
    hojaMuestreada: datos.hojaMuestreada ?? null,
    observaciones: datos.observaciones ?? null,
    createdAt: ahoraISO(),
  };
  db.insert(sapReadings).values(fila).run();
  return fila;
}

export function listarSapReadingsDeLote(db: AppDatabase, loteId: string): SapReading[] {
  return db
    .select()
    .from(sapReadings)
    .where(eq(sapReadings.loteId, loteId))
    .orderBy(desc(sapReadings.fecha))
    .all();
}
