import type { VercelRequest } from '@vercel/node';

/**
 * Protección básica anti-abuso: la app envía un header con un secreto compartido
 * (APP_SHARED_SECRET). Esto NO es autenticación de usuario real — es solo para que
 * la URL del backend no quede abierta a cualquiera en internet que la descubra y
 * gaste crédito de la API. Un atacante que descompile la app podría extraer este
 * valor igual que extraería una API key embebida, pero la diferencia importante es
 * que este secreto:
 * - Es revocable/rotable desde la variable de entorno del servidor, sin publicar
 *   una nueva versión de la app.
 * - Nunca da acceso directo a la cuenta ni a la API key real de Anthropic.
 * Para producción real (con muchos productores), sustituir por autenticación de
 * usuario (cuenta de productor) cuando exista esa capa en la app.
 */
export function tieneAutorizacionValida(req: VercelRequest): boolean {
  const secretoEsperado = process.env.APP_SHARED_SECRET;
  if (!secretoEsperado) {
    // Si el servidor no tiene el secreto configurado, se rechaza por defecto en vez
    // de dejar el endpoint abierto por un error de configuración.
    return false;
  }
  const recibido = req.headers['x-chaman-app-key'];
  return recibido === secretoEsperado;
}
