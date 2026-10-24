const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Permite importar los archivos .sql generados por drizzle-kit como texto
// (migraciones de expo-sqlite: https://orm.drizzle.team/quick-sqlite/expo).
config.resolver.sourceExts.push('sql');
config.transformer.babelTransformerPath = require.resolve('./metro.transformer.js');

// expo-sqlite en web usa wa-sqlite (WebAssembly); sin esto Metro no resuelve el .wasm.
config.resolver.assetExts.push('wasm');

// wa-sqlite necesita SharedArrayBuffer, que el navegador solo habilita con aislamiento de
// origen cruzado (COOP/COEP). Sin estas cabeceras la app web falla al abrir la base de datos.
// En producción web, el hosting debe enviar las mismas cabeceras.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
