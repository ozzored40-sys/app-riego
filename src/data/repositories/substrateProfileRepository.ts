import { eq, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { substrateProfiles } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevoSubstrateProfile {
  loteId: string;
  fecha: string;
  tipo: string;
  volumenLitrosPorPlanta: number;
  capacidadRetencionPct: number;
  porosidadAireacionPct?: number;
  ceDsM?: number;
  pH?: number;
  porcentajeDrenajeObjetivo: number;
  humedadActualPct?: number;
  humedadMinPct?: number;
  humedadMaxPct?: number;
}

export type SubstrateProfile = typeof substrateProfiles.$inferSelect;

export function crearSubstrateProfile(
  db: AppDatabase,
  datos: NuevoSubstrateProfile,
): SubstrateProfile {
  const fila = {
    id: generarId('sustrato'),
    loteId: datos.loteId,
    fecha: datos.fecha,
    tipo: datos.tipo,
    volumenLitrosPorPlanta: datos.volumenLitrosPorPlanta,
    capacidadRetencionPct: datos.capacidadRetencionPct,
    porosidadAireacionPct: datos.porosidadAireacionPct ?? null,
    ceDsM: datos.ceDsM ?? null,
    pH: datos.pH ?? null,
    porcentajeDrenajeObjetivo: datos.porcentajeDrenajeObjetivo,
    humedadActualPct: datos.humedadActualPct ?? null,
    humedadMinPct: datos.humedadMinPct ?? null,
    humedadMaxPct: datos.humedadMaxPct ?? null,
    createdAt: ahoraISO(),
  };
  db.insert(substrateProfiles).values(fila).run();
  return fila;
}

export function ultimoSubstrateProfileDeLote(
  db: AppDatabase,
  loteId: string,
): SubstrateProfile | undefined {
  return db
    .select()
    .from(substrateProfiles)
    .where(eq(substrateProfiles.loteId, loteId))
    .orderBy(desc(substrateProfiles.fecha))
    .get();
}
