// Re-exporta las migraciones generadas por `npm run db:generate` (drizzle-kit) para que
// el resto de la app (el root layout, vía drizzle-orm/expo-sqlite/migrator's useMigrations)
// no necesite conocer la ruta relativa al directorio drizzle/.
export { default as migrations } from '../../../drizzle/migrations/migrations';
