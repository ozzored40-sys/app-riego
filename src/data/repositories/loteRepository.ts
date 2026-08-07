import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { lotes } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { SistemaProduccion } from '../../domain/types/crop';

export interface NuevoLote {
  nombre: string;
  cropId: string;
  sistemaProduccion: SistemaProduccion;
  fechaSiembra: string;
  areaHa: number;
  plantasPorHa: number;
  rendimientoObjetivoTonHa: number;
  etapaIdManual?: string;
  ubicacionLat?: number;
  ubicacionLon?: number;
}

export type Lote = typeof lotes.$inferSelect;

export function crearLote(db: AppDatabase, datos: NuevoLote): Lote {
  const now = ahoraISO();
  const fila = {
    id: generarId('lote'),
    nombre: datos.nombre,
    cropId: datos.cropId,
    sistemaProduccion: datos.sistemaProduccion,
    fechaSiembra: datos.fechaSiembra,
    etapaIdManual: datos.etapaIdManual ?? null,
    areaHa: datos.areaHa,
    plantasPorHa: datos.plantasPorHa,
    rendimientoObjetivoTonHa: datos.rendimientoObjetivoTonHa,
    ubicacionLat: datos.ubicacionLat ?? null,
    ubicacionLon: datos.ubicacionLon ?? null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(lotes).values(fila).run();
  return fila;
}

export function obtenerLote(db: AppDatabase, id: string): Lote | undefined {
  return db.select().from(lotes).where(eq(lotes.id, id)).get();
}

export function listarLotes(db: AppDatabase): Lote[] {
  return db.select().from(lotes).orderBy(desc(lotes.createdAt)).all();
}

export function actualizarLote(
  db: AppDatabase,
  id: string,
  cambios: Partial<NuevoLote>,
): Lote | undefined {
  db.update(lotes)
    .set({ ...cambios, updatedAt: ahoraISO() })
    .where(eq(lotes.id, id))
    .run();
  return obtenerLote(db, id);
}

export function eliminarLote(db: AppDatabase, id: string): void {
  db.delete(lotes).where(eq(lotes.id, id)).run();
}
