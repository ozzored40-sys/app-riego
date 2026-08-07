import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { irrigationSystems } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevoIrrigationSystem {
  loteId: string;
  tipo: string;
  caudalEmisorLH: number;
  emisoresPorPlanta: number;
  separacionEmisoresCm?: number;
  presionOperativaBar?: number;
  eficienciaPct: number;
  uniformidadPct?: number;
  numeroSectores?: number;
  caudalTotalLH?: number;
  horasDisponiblesRiegoDia?: number;
  porcentajeDrenajeDeseado?: number;
  numeroPulsos: number;
}

export type IrrigationSystem = typeof irrigationSystems.$inferSelect;

export function crearIrrigationSystem(
  db: AppDatabase,
  datos: NuevoIrrigationSystem,
): IrrigationSystem {
  const fila = {
    id: generarId('riego'),
    loteId: datos.loteId,
    tipo: datos.tipo,
    caudalEmisorLH: datos.caudalEmisorLH,
    emisoresPorPlanta: datos.emisoresPorPlanta,
    separacionEmisoresCm: datos.separacionEmisoresCm ?? null,
    presionOperativaBar: datos.presionOperativaBar ?? null,
    eficienciaPct: datos.eficienciaPct,
    uniformidadPct: datos.uniformidadPct ?? null,
    numeroSectores: datos.numeroSectores ?? null,
    caudalTotalLH: datos.caudalTotalLH ?? null,
    horasDisponiblesRiegoDia: datos.horasDisponiblesRiegoDia ?? null,
    porcentajeDrenajeDeseado: datos.porcentajeDrenajeDeseado ?? null,
    numeroPulsos: datos.numeroPulsos,
    createdAt: ahoraISO(),
  };
  db.insert(irrigationSystems).values(fila).run();
  return fila;
}

export function ultimoIrrigationSystemDeLote(
  db: AppDatabase,
  loteId: string,
): IrrigationSystem | undefined {
  return db
    .select()
    .from(irrigationSystems)
    .where(eq(irrigationSystems.loteId, loteId))
    .orderBy(desc(irrigationSystems.createdAt))
    .get();
}
