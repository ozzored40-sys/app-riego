const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Permite importar los archivos .sql generados por drizzle-kit como texto
// (migraciones de expo-sqlite: https://orm.drizzle.team/quick-sqlite/expo).
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './src/global.css' });
