import { asc, eq } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { specialistMessages } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevoSpecialistMessage {
  especialistaId: string;
  rol: 'user' | 'assistant';
  contenido: string;
}

export type SpecialistMessage = typeof specialistMessages.$inferSelect;

export function crearSpecialistMessage(
  db: AppDatabase,
  datos: NuevoSpecialistMessage,
): SpecialistMessage {
  const fila = {
    id: generarId('espchat'),
    especialistaId: datos.especialistaId,
    rol: datos.rol,
    contenido: datos.contenido,
    createdAt: ahoraISO(),
  };
  db.insert(specialistMessages).values(fila).run();
  return fila;
}

/** Orden cronológico ascendente: el más viejo primero, como espera la API de chat y la UI. */
export function listarMensajesEspecialista(
  db: AppDatabase,
  especialistaId: string,
): SpecialistMessage[] {
  return db
    .select()
    .from(specialistMessages)
    .where(eq(specialistMessages.especialistaId, especialistaId))
    .orderBy(asc(specialistMessages.createdAt))
    .all();
}

export function borrarHistorialEspecialista(db: AppDatabase, especialistaId: string): void {
  db.delete(specialistMessages).where(eq(specialistMessages.especialistaId, especialistaId)).run();
}
