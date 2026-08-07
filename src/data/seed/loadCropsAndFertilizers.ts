import type { AppDatabase } from '../db/types';
import { FERTILIZER_LIBRARY } from '../../domain/fertilizers/library';
import { upsertFertilizante } from '../repositories/fertilizerInventoryRepository';

/**
 * Siembra inicial: carga la biblioteca de fertilizantes comerciales de referencia
 * a la base de datos local (idempotente: upsert por id, no duplica en reinicios).
 * Los cultivos NO se siembran en la base de datos: viven como datos estáticos en
 * src/domain/crops (no cambian por lote ni requieren edición del usuario).
 */
export function sembrarFertilizantes(db: AppDatabase): void {
  for (const fertilizante of FERTILIZER_LIBRARY) {
    upsertFertilizante(db, fertilizante, 0);
  }
}
