import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from './schema';

/**
 * Tipo de base de datos agnóstico del driver: tanto drizzle-orm/expo-sqlite (app)
 * como drizzle-orm/better-sqlite3 (tests) devuelven un BaseSQLiteDatabase 'sync'
 * sobre el mismo schema, así que los repositorios pueden aceptar este tipo y
 * funcionar con cualquiera de los dos sin cambiar código.
 */
// `any` es intencional: TRunResult difiere por driver (expo-sqlite vs better-sqlite3 en tests).
export type AppDatabase = BaseSQLiteDatabase<'sync', any, typeof schema>;
