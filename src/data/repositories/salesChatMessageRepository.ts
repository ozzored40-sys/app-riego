import { eq, asc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { salesChatMessages } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevoSalesChatMessage {
  loteId: string;
  rol: 'user' | 'assistant';
  contenido: string;
}

export type SalesChatMessage = typeof salesChatMessages.$inferSelect;

export function crearSalesChatMessage(
  db: AppDatabase,
  datos: NuevoSalesChatMessage,
): SalesChatMessage {
  const fila = {
    id: generarId('ventaschat'),
    loteId: datos.loteId,
    rol: datos.rol,
    contenido: datos.contenido,
    createdAt: ahoraISO(),
  };
  db.insert(salesChatMessages).values(fila).run();
  return fila;
}

/** Orden cronológico ascendente: el más viejo primero, como espera la API de chat y la UI. */
export function listarSalesChatMessagesDeLote(db: AppDatabase, loteId: string): SalesChatMessage[] {
  return db
    .select()
    .from(salesChatMessages)
    .where(eq(salesChatMessages.loteId, loteId))
    .orderBy(asc(salesChatMessages.createdAt))
    .all();
}

export function borrarHistorialVentas(db: AppDatabase, loteId: string): void {
  db.delete(salesChatMessages).where(eq(salesChatMessages.loteId, loteId)).run();
}
