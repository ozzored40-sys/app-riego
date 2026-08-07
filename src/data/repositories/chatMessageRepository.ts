import { eq, asc } from 'drizzle-orm';
import type { AppDatabase } from '../db/types';
import { chatMessages } from '../db/schema';
import { generarId, ahoraISO } from '../id';

export interface NuevoChatMessage {
  loteId: string;
  rol: 'user' | 'assistant';
  contenido: string;
}

export type ChatMessage = typeof chatMessages.$inferSelect;

export function crearChatMessage(db: AppDatabase, datos: NuevoChatMessage): ChatMessage {
  const fila = {
    id: generarId('chat'),
    loteId: datos.loteId,
    rol: datos.rol,
    contenido: datos.contenido,
    createdAt: ahoraISO(),
  };
  db.insert(chatMessages).values(fila).run();
  return fila;
}

/** Orden cronológico ascendente: el más viejo primero, como espera la API de chat y la UI. */
export function listarChatMessagesDeLote(db: AppDatabase, loteId: string): ChatMessage[] {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.loteId, loteId))
    .orderBy(asc(chatMessages.createdAt))
    .all();
}

export function borrarHistorialChat(db: AppDatabase, loteId: string): void {
  db.delete(chatMessages).where(eq(chatMessages.loteId, loteId)).run();
}
