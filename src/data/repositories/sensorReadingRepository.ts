import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { sensorReadings } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export type TipoLecturaSensor =
  | 'ceAplicada'
  | 'phAplicado'
  | 'caudal'
  | 'humedadSustrato'
  | 'aguaAplicadaL'
  | 'fertilizanteAplicadoKg';

export interface NuevaSensorReading {
  loteId: string;
  fecha: string;
  tipo: TipoLecturaSensor;
  valor: number;
  unidad: string;
  capturadoPor?: string;
}

export type SensorReading = typeof sensorReadings.$inferSelect;

export function crearSensorReading(db: AppDatabase, datos: NuevaSensorReading): SensorReading {
  const fila = {
    id: generarId('sensor'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    tipo: datos.tipo,
    valor: datos.valor,
    unidad: datos.unidad,
    capturadoPor: datos.capturadoPor ?? null,
    createdAt: ahoraISO(),
  };
  db.insert(sensorReadings).values(fila).run();
  return fila;
}

export function listarSensorReadingsDeLote(
  db: AppDatabase,
  loteId: string,
  tipo?: TipoLecturaSensor,
): SensorReading[] {
  const base = db.select().from(sensorReadings).where(eq(sensorReadings.loteId, loteId));
  const filas = base.orderBy(desc(sensorReadings.fecha)).all();
  return tipo ? filas.filter((f) => f.tipo === tipo) : filas;
}
