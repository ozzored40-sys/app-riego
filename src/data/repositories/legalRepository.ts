import { desc, getTableName, is } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { AppDatabase } from '../db/types';
import * as schema from '../db/schema';
import { aceptacionesLegales } from '../db/schema';
import { generarId, ahoraISO } from '../id';
import { sembrarFertilizantes } from '../seed/loadCropsAndFertilizers';

export type AceptacionLegal = typeof aceptacionesLegales.$inferSelect;

export function registrarAceptacionLegal(
  db: AppDatabase,
  version: string,
  plataforma: string,
): AceptacionLegal {
  const fila = { id: generarId('acepta'), version, aceptadoEn: ahoraISO(), plataforma };
  db.insert(aceptacionesLegales).values(fila).run();
  return fila;
}

export function obtenerUltimaAceptacionLegal(db: AppDatabase): AceptacionLegal | undefined {
  return db.select().from(aceptacionesLegales).orderBy(desc(aceptacionesLegales.aceptadoEn)).get();
}

export function versionLegalAceptada(db: AppDatabase, version: string): boolean {
  return obtenerUltimaAceptacionLegal(db)?.version === version;
}

/**
 * "Borrar todos mis datos": vacía todas las tablas del usuario (lotes, análisis, CRM,
 * conversaciones, inventario…) y vuelve a sembrar el catálogo de fertilizantes de
 * referencia. Conserva el registro de aceptaciones legales, que no contiene datos
 * personales y sirve como evidencia de la versión aceptada.
 */
export function borrarTodosLosDatos(db: AppDatabase): void {
  const tablas = tablasBorrables();
  db.transaction((tx) => {
    for (const tabla of tablas) tx.delete(tabla).run();
  });
  sembrarFertilizantes(db);
}

function tablasBorrables(): SQLiteTable[] {
  const valores: unknown[] = Object.values(schema);
  return valores.filter(
    (valor): valor is SQLiteTable => is(valor, SQLiteTable) && valor !== aceptacionesLegales,
  );
}

/** Nombres de las tablas que borra borrarTodosLosDatos (útil para pruebas). */
export function tablasDeUsuario(): string[] {
  return tablasBorrables().map((tabla) => getTableName(tabla));
}
