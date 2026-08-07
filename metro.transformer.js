// Envuelve el transformer por defecto de Expo para que los archivos .sql generados por
// drizzle-kit (migraciones) se incluyan como texto plano, no se intenten parsear como JS.
// Ver: https://orm.drizzle.team/docs/get-started/expo-new
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

module.exports.transform = async ({ src, filename, options }) => {
  if (filename.endsWith('.sql')) {
    return upstreamTransformer.transform({
      src: `module.exports = ${JSON.stringify(src)};`,
      filename,
      options,
    });
  }
  return upstreamTransformer.transform({ src, filename, options });
};

module.exports.getCacheKey = upstreamTransformer.getCacheKey;
