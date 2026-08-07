const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Permite importar los archivos .sql generados por drizzle-kit como texto
// (migraciones de expo-sqlite: https://orm.drizzle.team/quick-sqlite/expo).
config.resolver.sourceExts.push('sql');
config.transformer.babelTransformerPath = require.resolve('./metro.transformer.js');

// expo-sqlite en web usa wa-sqlite (WebAssembly); sin esto Metro no resuelve el .wasm.
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './src/global.css' });
