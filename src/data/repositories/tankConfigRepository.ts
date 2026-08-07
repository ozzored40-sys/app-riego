import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { tankConfigs } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { TankCMode, TankId } from '../../domain/tanks/compatibility';

export interface NuevoTankConfig {
  loteId: string;
  tanque: TankId;
  volumenLitros: number;
  relacionInyeccion: number;
  numeroPulsos: number;
  modoTanqueC?: TankCMode;
}

export type TankConfigRow = typeof tankConfigs.$inferSelect;

export function guardarTankConfig(db: AppDatabase, datos: NuevoTankConfig): TankConfigRow {
  const fila = {
    id: generarId('tanque'),
    loteId: datos.loteId,
    tanque: datos.tanque,
    volumenLitros: datos.volumenLitros,
    relacionInyeccion: datos.relacionInyeccion,
    numeroPulsos: datos.numeroPulsos,
    modoTanqueC: datos.modoTanqueC ?? null,
    createdAt: ahoraISO(),
  };
  db.insert(tankConfigs).values(fila).run();
  return fila;
}

export function listarTankConfigsDeLote(db: AppDatabase, loteId: string): TankConfigRow[] {
  return db.select().from(tankConfigs).where(eq(tankConfigs.loteId, loteId)).all();
}
