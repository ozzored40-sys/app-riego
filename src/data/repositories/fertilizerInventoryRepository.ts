import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { fertilizantes } from '../db/schema';
import { ahoraISO } from '../id';
import type { FertilizerProduct } from '../../domain/types/fertilizer';
import { fertilizerToRow, rowToFertilizer } from '../mappers/fertilizerMapper';

export type FertilizerInventoryItem = FertilizerProduct & { stockKg: number };

/** Inserta un fertilizante (de la biblioteca semilla o personalizado) si no existe ya por id. */
export function upsertFertilizante(
  db: AppDatabase,
  producto: FertilizerProduct,
  stockKg = 0,
): FertilizerInventoryItem {
  const now = ahoraISO();
  const fila = fertilizerToRow(producto, stockKg, now);
  const { createdAt: _createdAt, ...camposActualizables } = fila;
  db.insert(fertilizantes)
    .values(fila)
    .onConflictDoUpdate({
      target: fertilizantes.id,
      set: camposActualizables,
    })
    .run();
  return rowToFertilizer(fila);
}

export function listarInventarioFertilizantes(db: AppDatabase): FertilizerInventoryItem[] {
  return db.select().from(fertilizantes).all().map(rowToFertilizer);
}

export function obtenerFertilizante(
  db: AppDatabase,
  id: string,
): FertilizerInventoryItem | undefined {
  const fila = db.select().from(fertilizantes).where(eq(fertilizantes.id, id)).get();
  return fila ? rowToFertilizer(fila) : undefined;
}

export function actualizarStockFertilizante(db: AppDatabase, id: string, stockKg: number): void {
  db.update(fertilizantes)
    .set({ stockKg, updatedAt: ahoraISO() })
    .where(eq(fertilizantes.id, id))
    .run();
}

export function actualizarPrecioFertilizante(
  db: AppDatabase,
  id: string,
  costoPorKg: number,
): void {
  db.update(fertilizantes)
    .set({ costoPorKg, updatedAt: ahoraISO() })
    .where(eq(fertilizantes.id, id))
    .run();
}
