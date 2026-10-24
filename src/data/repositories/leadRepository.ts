import { desc, eq, like } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { leads } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import type { EtapaPipeline } from '../../domain/chaman/pipeline';

export type Lead = typeof leads.$inferSelect;
export type NuevoLead = Omit<Lead, 'id' | 'etapa' | 'createdAt' | 'updatedAt' | 'protocoloIa'>;

export function crearLead(db: AppDatabase, datos: NuevoLead): Lead {
  const ahora = ahoraISO();
  const fila: Lead = {
    ...datos,
    id: generarId('lead'),
    etapa: 'N1',
    protocoloIa: null,
    createdAt: ahora,
    updatedAt: ahora,
  };
  db.insert(leads).values(fila).run();
  return fila;
}

/** Más recientes primero, como se muestran en el CRM. */
export function listarLeads(db: AppDatabase): Lead[] {
  return db.select().from(leads).orderBy(desc(leads.createdAt)).all();
}

export function obtenerLead(db: AppDatabase, id: string): Lead | undefined {
  return db.select().from(leads).where(eq(leads.id, id)).get();
}

export function actualizarEtapaLead(db: AppDatabase, id: string, etapa: EtapaPipeline): void {
  db.update(leads).set({ etapa, updatedAt: ahoraISO() }).where(eq(leads.id, id)).run();
}

export function actualizarNotasLead(db: AppDatabase, id: string, notas: string): void {
  db.update(leads).set({ notas, updatedAt: ahoraISO() }).where(eq(leads.id, id)).run();
}

export function guardarProtocoloIaLead(db: AppDatabase, id: string, protocoloIa: string): void {
  db.update(leads).set({ protocoloIa, updatedAt: ahoraISO() }).where(eq(leads.id, id)).run();
}

export function borrarLead(db: AppDatabase, id: string): void {
  db.delete(leads).where(eq(leads.id, id)).run();
}

/** Cuántos dictámenes ya tienen folio de ese año (para asignar el siguiente consecutivo). */
export function contarFoliosDelAnio(db: AppDatabase, anio: number): number {
  return db
    .select({ id: leads.id })
    .from(leads)
    .where(like(leads.folio, `DOC-CHAM-${anio}-%`))
    .all().length;
}
