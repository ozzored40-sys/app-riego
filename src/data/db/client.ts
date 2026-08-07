import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'chaman-nutriflow.db';

const expoDb = openDatabaseSync(DB_NAME, { enableChangeListener: true });

/** Instancia de base de datos de la app (expo-sqlite + drizzle), usada por state/ y app/. */
export const db = drizzle(expoDb, { schema });

export { expoDb };
