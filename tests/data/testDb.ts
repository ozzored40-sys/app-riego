import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/data/db/schema';
import type { AppDatabase } from '../../src/data/db/types';

/**
 * Base de datos SQLite en memoria para tests de integración de repositorios,
 * usando el mismo schema.ts que la app (drizzle-orm/sqlite-core es agnóstico
 * del driver). Se aplica el SQL de todas las migraciones generadas por
 * drizzle-kit, en orden, directamente, sin depender del cargador de .sql de
 * Metro (solo existe en RN).
 */
export function crearBaseDeDatosDePrueba(): AppDatabase {
  const sqlite = new Database(':memory:');
  const directorioMigraciones = path.resolve(__dirname, '../../drizzle/migrations');
  const archivosMigracion = fs
    .readdirSync(directorioMigraciones)
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort();

  for (const archivo of archivosMigracion) {
    const sql = fs.readFileSync(path.join(directorioMigraciones, archivo), 'utf-8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) sqlite.exec(trimmed);
    }
  }

  return drizzle(sqlite, { schema }) as unknown as AppDatabase;
}
